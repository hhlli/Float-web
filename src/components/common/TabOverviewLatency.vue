<template>
  <div class="latency-unified-container">
    <div v-if="latencyData.length === 0" class="latency-loading">加载延迟中...</div>
    <div v-else class="latency-content">
      
      <div class="unified-chart-wrapper">
        <svg class="unified-chart" viewBox="0 0 100 40" preserveAspectRatio="none">
          <line x1="0" y1="35" x2="100" y2="35" stroke="var(--border-color)" stroke-width="0.5" stroke-dasharray="2,2" />
          
          <polyline 
            v-for="net in latencyData" 
            :key="'line-' + net.name"
            :points="getCombinedPoints(net.history)" 
            :stroke="net.color" 
            fill="none" 
            stroke-width="1" 
            opacity="0.6"
            stroke-linecap="round" 
            stroke-linejoin="round" 
            class="anim-line"
          />
          
          <circle 
            v-for="net in latencyData" 
            :key="'dot-' + net.name"
            cx="100" 
            :cy="getLatestPointY(net.history)" 
            r="1.2" 
            :fill="net.color" 
            opacity="0.8"
          />
        </svg>
      </div>

      <div class="unified-legend">
        <div v-for="net in latencyData" :key="net.name" class="legend-item">
          <span class="legend-dot" :style="{ backgroundColor: net.color }"></span>
          <span class="legend-name">{{ net.name }}</span>
          <span class="legend-ping" :style="{ color: net.color }">
            {{ Number(net.ping) > 0 ? net.ping + ' ms' : '超时' }}
          </span>
          <span class="legend-count">{{ net.count }} 节点</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import request from '@/utils/request.js'

const props = defineProps({
  server: Object
})

const latencyData = ref([])
let latencyTimer = null

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

const getGlobalMax = () => {
  let maxPing = 80
  latencyData.value.forEach(net => {
    net.history.forEach(p => {
      if (p > maxPing) maxPing = p
    })
  })
  return maxPing
}

const getCombinedPoints = (history) => {
  if (!history || history.length < 2) return "0,35 100,35"
  const maxPing = getGlobalMax()

  return history.map((val, index) => {
    const x = (index / (history.length - 1)) * 100
    let y = 35
    if (val === 0) {
      y = 0 
    } else {
      y = 35 - (val / maxPing) * 30
    }
    return `${x},${y}`
  }).join(' ')
}

const getLatestPointY = (history) => {
  if (!history || history.length === 0) return 35
  const val = history[history.length - 1]
  if (val === 0) return 0
  const maxPing = getGlobalMax()
  return 35 - (val / maxPing) * 30
}

watch(() => props.server?.node_id, (newId) => {
  if (newId) fetchLatency()
}, { immediate: true })

onMounted(() => {
  fetchLatency()
  latencyTimer = setInterval(fetchLatency, 5000)
})

onUnmounted(() => {
  if (latencyTimer) clearInterval(latencyTimer)
})
</script>

<style scoped>
.latency-unified-container { width: 100%; }
.latency-loading { font-size: 13px; color: var(--text-muted); }
.latency-content { display: flex; flex-direction: column; gap: 12px; }

.unified-chart-wrapper {
  width: 100%;
  height: 32px;
  position: relative;
  border-bottom: 1px dashed var(--border-color);
  padding-bottom: 8px;
}
.unified-chart {
  width: 100%;
  height: 100%;
  overflow: visible;
}
.anim-line {
  transition: all 0.3s ease;
}

/* 重新排版的图例与数据区 */
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
  color: var(--text-main);
}
.legend-ping {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 14px;
  font-weight: 600;
}
.legend-count {
  font-size: 12px;
  color: var(--text-muted);
}

</style>