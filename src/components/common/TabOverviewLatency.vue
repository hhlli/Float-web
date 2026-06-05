<template>
  <div class="latency-unified-container">
    <div v-if="latencyData.length === 0" class="latency-loading">加载延迟中...</div>
    <div v-else class="latency-content">
      
      <div 
        class="unified-chart-wrapper"
        ref="chartRef"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
      >
        <svg class="unified-chart" viewBox="0 0 100 40" preserveAspectRatio="none">
          <defs>
            <linearGradient 
              v-for="(net, index) in latencyData" 
              :key="'grad-' + index"
              :id="'latency-grad-' + index" 
              x1="0%" y1="0%" x2="100%" y2="0%"
            >
              <stop 
                v-for="(val, vIndex) in net.history" 
                :key="'stop-' + vIndex"
                :offset="(vIndex / (net.history.length - 1 || 1)) * 100 + '%'" 
                :stop-color="getLatencyColor(val)" 
              />
            </linearGradient>
          </defs>

          <path 
            v-for="(net, index) in latencyData" 
            :key="'line-' + net.name"
            :d="getSmoothPath(net.history)" 
            :stroke="`url(#latency-grad-${index})`" 
            fill="none" 
            stroke-width="1" 
            vector-effect="non-scaling-stroke"
            opacity="0.85"
            stroke-linecap="round" 
            stroke-linejoin="round"
          />

          <line 
            v-if="hoverState.visible"
            :x1="hoverState.xPct" 
            y1="0" 
            :x2="hoverState.xPct" 
            y2="40" 
            stroke="var(--text-muted)" 
            stroke-width="0.8" 
            vector-effect="non-scaling-stroke"
            stroke-dasharray="4,4" 
            opacity="0.6"
          />
        </svg>
      </div>

      <div class="unified-legend">
        <div v-for="net in latencyData" :key="net.name" class="legend-item">
          <span class="legend-dot" :style="{ backgroundColor: getLatencyColor(net.ping) }"></span>
          <span class="legend-name">{{ net.name }}</span>
          <span class="legend-ping" :style="{ color: getLatencyColor(net.ping) }">
            {{ Number(net.ping) > 0 ? net.ping + ' ms' : '超时' }}
          </span>
          <span class="legend-count">{{ net.count }} 节点</span>
        </div>
      </div>

    </div>

    <div 
      v-if="hoverState.visible" 
      class="simple-tooltip" 
      :style="{ top: hoverState.mouseY + 'px', left: hoverState.mouseX + 'px' }"
    >
      <div v-for="item in hoverState.values" :key="'tooltip-' + item.name" class="tooltip-row">
        <div class="tooltip-label">
          <span class="tooltip-dot" :style="{ backgroundColor: getLatencyColor(item.val) }"></span>
          <span class="tooltip-name">{{ item.name }}</span>
        </div>
        <span class="tooltip-val" :style="{ color: getLatencyColor(item.val) }">
          {{ item.val > 0 ? item.val.toFixed(1) + ' ms' : '超时' }}
        </span>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, reactive } from 'vue'
import request from '@/utils/request.js'

const props = defineProps({
  server: Object
})

const latencyData = ref([])
const chartRef = ref(null)
let latencyTimer = null

const hoverState = reactive({
  visible: false,
  xPct: 0,
  mouseX: 0,
  mouseY: 0,
  values: []
})

// 根据延迟绝对值渲染颜色
const getLatencyColor = (pingVal) => {
  const p = Number(pingVal)
  if (p <= 0) return '#94a3b8' 
  if (p <= 80) return '#10b981' 
  if (p <= 200) return '#f59e0b' 
  return '#ef4444' 
}

const fetchLatency = async () => {
  const nodeId = props.server?.node_id
  if (!nodeId) return
  try {
    const data = await request.get(`/api/data/ping/summary?node_id=${nodeId}`)
    latencyData.value = data || []
  } catch (e) {
    console.error('Fetch latency summary error:', e)
  }
}

// 提取全局动态极值区间，供三条线共用同一比例尺
const getGlobalRange = () => {
  let min = 9999;
  let max = 0;
  let hasValid = false;

  latencyData.value.forEach(net => {
    net.history.forEach(p => {
      if (p > 0) {
        hasValid = true;
        if (p < min) min = p;
        if (p > max) max = p;
      }
    });
  });

  if (!hasValid) return { min: 0, max: 10 };

  const spread = max - min;
  if (spread < 4) {
    const center = (max + min) / 2;
    return { min: Math.max(0, center - 2), max: center + 2 };
  }

  return { min, max };
}

// 独立计算单一数值的 Y 坐标
const getPointY = (val) => {
  if (val === 0 || val === undefined) return 38 // 超时沉底
  const { min, max } = getGlobalRange()
  const range = max - min || 1
  return 38 - ((val - min) / range) * 36 // 映射到 2px ~ 38px 之间
}

// 生成平滑曲线路径
const getSmoothPath = (history) => {
  if (!history || history.length < 2) return "M 0 38 L 100 38"
  const points = history.map((val, index) => {
    const x = (index / (history.length - 1)) * 100
    const y = getPointY(val)
    return { x, y }
  })
  
  // 使用三次贝塞尔曲线 (Cubic Bezier) 计算平滑节点
  let path = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i]
    const next = points[i + 1]
    const cpX = (curr.x + next.x) / 2
    path += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`
  }
  return path
}

// 鼠标悬浮交互计算
const handleMouseMove = (e) => {
  if (!chartRef.value || latencyData.value.length === 0) return
  
  const rect = chartRef.value.getBoundingClientRect()
  const offsetX = e.clientX - rect.left
  const len = latencyData.value[0].history.length
  
  if (len <= 1) return

  const segmentWidth = rect.width / (len - 1)
  let idx = Math.round(offsetX / segmentWidth)
  idx = Math.max(0, Math.min(idx, len - 1))

  hoverState.xPct = (idx / (len - 1)) * 100
  hoverState.mouseX = e.clientX + 15
  hoverState.mouseY = e.clientY + 15
  hoverState.visible = true

  // 提取当前切面下的三网数值
  hoverState.values = latencyData.value.map(net => ({
    name: net.name,
    val: net.history[idx]
  }))
}

const handleMouseLeave = () => {
  hoverState.visible = false
}

watch(() => props.server?.node_id, (newId) => {
  if (newId) fetchLatency()
}, { immediate: true })

onMounted(() => {
  fetchLatency()
  latencyTimer = setInterval(fetchLatency, 60000)
})

onUnmounted(() => {
  if (latencyTimer) clearInterval(latencyTimer)
})
</script>

<style scoped>
.latency-unified-container { 
  width: 100%; 
  height: 100%; 
}
.latency-loading { font-size: 13px; color: var(--text-muted); }
.latency-content { 
  display: flex; 
  flex-direction: column; 
  height: 100%;
  justify-content: center; /* 与负载卡片保持同样的垂直居中逻辑 */
  gap: 10px; /* 调整此值以对齐右侧底部基线 */
}

/* 统一折线图区域 */
.unified-chart-wrapper {
  width: 100%;
  height: 42px;
  margin-top: -6px;
  position: relative;
}
.unified-chart {
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* 底部图例排版 */
.unified-legend {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}
.legend-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  align-self: center;
}
.legend-name {
  font-size: 13px;
  color: var(--text-muted);
}
.legend-ping {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 14px;
  font-weight: 600;
}
.legend-count {
  font-size: 11px;
  color: var(--text-muted);
}

/* 极简全局悬浮提示框 */
.simple-tooltip {
  position: fixed;
  z-index: 9999;
  background: var(--surface-color, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  padding: 8px 12px;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 120px;
}
.tooltip-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}
.tooltip-label {
  display: flex;
  align-items: center;
  gap: 6px;
}
.tooltip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.tooltip-name {
  color: var(--text-muted);
}
.tooltip-val {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-weight: 600;
}
</style>