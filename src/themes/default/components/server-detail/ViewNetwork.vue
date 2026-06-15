<template>
  <div class="network-container">
    <div v-show="!networkStats || networkStats.length === 0" class="empty-state">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
      <p>暂无延迟监测任务</p>
    </div>

  <div v-show="networkStats && networkStats.length > 0" class="ping-dashboard">
      <div class="chart-wrapper" style="position: relative;">
        <div ref="domPing" class="chart-wrap-network"></div>
        <button class="chart-legend-toggle" @click="toggleAllLegends" :title="isAllHidden ? '显示全部' : '隐藏全部'">
          <svg v-if="isAllHidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-eye">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-eye">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
      </div>

      <div class="ping-grid">
        <div
          v-for="item in networkStats"
          :key="item.target + item.nodeName"
          class="ping-card"
          :style="{ borderLeftColor: item.themeColor }"
        >
          <div class="card-info">
            <span class="card-name">{{ item.nodeName }}</span>
            <span class="card-target">{{ item.target }}</span>
          </div>
          <div class="card-stats">
            <span :style="{ color: item.themeColor }">{{ item.latest }}</span>
            <span :class="{ warn: parseFloat(item.loss) > 0 }">{{ item.loss }}% 丢包</span>
            <span>{{ item.jitter }} 波动</span>

            <div class="tooltip-wrapper">
              <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <div class="tooltip-content">
                <div class="tt-row"><span>最新</span> <span>{{ item.latest }}</span></div>
                <div class="tt-row"><span>平均值</span> <span>{{ item.avg }}</span></div>
                <div class="tt-row"><span>最小值</span> <span>{{ item.min }}</span></div>
                <div class="tt-row"><span>最大值</span> <span>{{ item.max }}</span></div>
                <div class="tt-row"><span>波动 (Jitter)</span> <span>{{ item.jitter }}</span></div>
                <div class="tt-row"><span>P50 (中位数)</span> <span>{{ item.p50 }}</span></div>
                <div class="tt-row"><span>P99 (长尾)</span> <span>{{ item.p99 }}</span></div>
                <div class="tt-row"><span>丢包率</span> <span :class="{ warn: parseFloat(item.loss) > 0 }">{{ item.loss }}%</span></div>
                <div class="tt-row"><span>样本数量</span> <span>{{ item.samples }}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, toRef, onMounted, onUnmounted } from 'vue'
import { useEChart } from '@/composables/server-detail/useEChart.js'
import * as echarts from 'echarts'

const props = defineProps({
  pingSummaryData:  { type: Array, default: () => [] },
  mergedPingOption: { type: Object, default: () => ({}) },
  pingRawData:      { type: Array, default: () => [] },
  legendSelected:   { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:legendSelected'])

const domPing = ref(null)

useEChart(domPing, toRef(props, 'mergedPingOption'))

let chartInstance = null

const isAllHidden = computed(() => {
  if (!props.pingSummaryData || props.pingSummaryData.length === 0) return false
  return props.pingSummaryData.every(item => props.legendSelected[item.nodeName] === false)
})

const handleLegendChange = (params) => {
  emit('update:legendSelected', params.selected || {})
}

onMounted(() => {
  setTimeout(() => {
    if (!domPing.value) return
    chartInstance = echarts.getInstanceByDom(domPing.value)
    if (chartInstance) {
      chartInstance.on('legendselectchanged', handleLegendChange)
    }
  }, 100)
})

onUnmounted(() => {
  if (chartInstance && !chartInstance.isDisposed()) {
    chartInstance.off('legendselectchanged', handleLegendChange)
  }
})

const toggleAllLegends = () => {
  const targetState = isAllHidden.value
  const newState = {}
  props.pingSummaryData.forEach(item => {
    newState[item.nodeName] = targetState
  })
  emit('update:legendSelected', newState)
}

const networkStats = computed(() => {
  return props.pingSummaryData.map(item => {
    const raw = props.pingRawData.find(r => r.target === item.target)
    const rows = raw?.rows || []
    
    const validRows = rows.filter(r => (r.ping_ms ?? r.latency_ms) != null && r.type !== 'MTR')
    const count = validRows.length

    let latest = 0, avg = 0, min = 0, max = 0, jitter = 0, p50 = 0, p99 = 0, loss = 0

    if (count > 0) {
      const pings = validRows.map(r => r.ping_ms ?? r.latency_ms).sort((a, b) => a - b)

      latest = validRows[count - 1].ping_ms ?? validRows[count - 1].latency_ms
      min = pings[0]
      max = pings[count - 1]
      avg = validRows.reduce((sum, r) => sum + (r.ping_ms ?? r.latency_ms), 0) / count

      p50 = pings[Math.floor(count * 0.5)]
      p99 = pings[Math.floor(count * 0.99)]

      loss = rows.reduce((sum, r) => sum + (r.loss || 0), 0) / rows.length
      jitter = validRows.reduce((sum, r) => sum + (r.jitter || 0), 0) / count
    } else {
      loss = rows.length ? 100 : 0
    }

    return {
      nodeName: item.nodeName,
      target: item.target,
      themeColor: item.themeColor,
      latest: count > 0 ? latest.toFixed(1) + ' ms' : '超时',
      avg: count > 0 ? avg.toFixed(1) + ' ms' : '-',
      min: count > 0 ? min.toFixed(1) + ' ms' : '-',
      max: count > 0 ? max.toFixed(1) + ' ms' : '-',
      jitter: count > 0 ? jitter.toFixed(1) + ' ms' : '-',
      p50: count > 0 ? p50.toFixed(1) + ' ms' : '-',
      p99: count > 0 ? p99.toFixed(1) + ' ms' : '-',
      loss: loss.toFixed(1),
      samples: rows.length
    }
  })
})
</script>

<style scoped>
.network-container { width: 100%; }
.ping-dashboard { display: flex; flex-direction: column; gap: 16px; }

.chart-wrapper {
  background: var(--surface-color, #fff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 10px;
  padding: 16px;
}
.chart-wrap-network {
  height: 300px;
  width: 100%;
}

.ping-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.ping-card {
  background: var(--surface-color, #fff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 6px;
  border-left-width: 3px;
  border-left-style: solid;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: box-shadow 0.15s;
}
.ping-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.07); }

.card-info {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.card-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main, #1e293b);
  white-space: nowrap;
  flex-shrink: 0;
}
.card-target {
  font-size: 11px;
  color: var(--text-muted, #94a3b8);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
}

.card-stats {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main, #334155);
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: center;
  flex-wrap: wrap; /* 允许在极端窄屏下自然换行 */
  gap: 6px 10px; /* 控制上下左右间距 */
}

.warn { color: #ef4444; }

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 60px 0;
  color: var(--text-muted, #94a3b8); font-size: 14px;
}

.tooltip-wrapper {
  margin-left: auto;
  display: flex;
  align-items: center;
  position: relative;
}

.info-icon {
  width: 14px;
  height: 14px;
  color: var(--text-muted, #94a3b8);
  cursor: default;
  transition: color 0.2s;
}

.info-icon:hover {
  color: var(--text-main, #1e293b);
}

.tooltip-content {
  visibility: hidden;
  opacity: 0;
  position: absolute;
  bottom: 150%;
  right: -10px;
  background: var(--surface-color, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  padding: 12px;
  width: 190px;
  z-index: 50;
  transition: opacity 0.2s, visibility 0.2s;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: normal;
}

.tooltip-wrapper:hover .tooltip-content {
  visibility: visible;
  opacity: 1;
}

.tt-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-main, #1e293b);
}

.tt-row span:first-child {
  color: var(--text-muted, #64748b);
}

.dark .tooltip-content {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
}

@media (max-width: 600px) {
  .ping-grid { grid-template-columns: 1fr; } /* 窄屏幕下改为单列显示，避免挤压 */
}

.chart-legend-toggle {
  position: absolute;
  right: 16px;
  bottom: 12px;
  background: transparent;
  border: none;
  color: var(--text-muted, #64748b);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  transition: color 0.2s;
  z-index: 10;
}

.chart-legend-toggle:hover {
  color: var(--text-main, #1e293b);
}

.icon-eye {
  width: 16px;
  height: 16px;
}
</style>