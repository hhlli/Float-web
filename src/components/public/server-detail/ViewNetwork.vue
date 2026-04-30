<template>
  <div class="network-container">
    <div v-if="!summaryWithLoss || summaryWithLoss.length === 0" class="empty-state">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
      <p>暂无延迟监测任务</p>
    </div>

    <div v-else class="ping-dashboard">
      <div class="ping-grid">
        <div
          v-for="item in summaryWithLoss"
          :key="item.target + item.nodeName"
          class="ping-card"
          :style="{ '--accent': item.themeColor }"
        >
          <div class="card-accent-bar" :style="{ background: item.themeColor }"/>
          <div class="card-header">
            <span class="card-name">{{ item.nodeName }}</span>
            <span class="card-target">{{ item.target }}</span>
          </div>
          <div class="card-metrics">
            <div class="metric-block">
              <span class="metric-label">当前延迟</span>
              <span class="metric-value" :style="{ color: item.themeColor }">
                {{ item.latestMs != null ? item.latestMs.toFixed(0) + ' ms' : '超时' }}
              </span>
            </div>
            <div class="metric-block">
              <span class="metric-label">丢包率</span>
              <span class="metric-value" :class="{ warn: item.lossRate > 0 }">
                {{ item.lossRate.toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-wrapper">
        <div ref="domPing" class="chart-wrap-network"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, toRef } from 'vue'
import { useEChart } from './useEChart.js'

const props = defineProps({
  pingSummaryData:  { type: Array, default: () => [] },
  mergedPingOption: { type: Object, default: () => ({}) },
  pingRawData:      { type: Array, default: () => [] },
})

const domPing = ref(null)
// 使用你自己的 hook 挂载 ECharts
useEChart(domPing, toRef(props, 'mergedPingOption'))

const summaryWithLoss = computed(() =>
  props.pingSummaryData.map(item => {
    const raw = props.pingRawData.find(r => r.target === item.target)
    const rows = raw?.rows || []
    const lossCount = rows.filter(r => (r.ping_ms ?? r.latency_ms) == null).length
    const lossRate = rows.length ? (lossCount / rows.length) * 100 : 0
    return { ...item, lossRate }
  })
)
</script>

<style scoped>
.network-container { width: 100%; }
.ping-dashboard { display: flex; flex-direction: column; gap: 16px; }

.ping-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.ping-card {
  position: relative;
  background: var(--surface-color, #fff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 10px;
  padding: 14px 16px 12px;
  overflow: hidden;
  transition: box-shadow 0.15s;
}
.ping-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.07); }

.card-accent-bar {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  border-radius: 10px 10px 0 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
  gap: 8px;
}
.card-name   { font-size: 14px; font-weight: 600; color: var(--text-main, #1e293b); }
.card-target { font-size: 11px; color: var(--text-muted, #94a3b8); font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100px; }

.card-metrics { display: flex; gap: 20px; }
.metric-block { display: flex; flex-direction: column; gap: 2px; }
.metric-label { font-size: 11px; color: var(--text-muted, #94a3b8); }
.metric-value { font-size: 18px; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--text-main, #1e293b); }
.metric-value.warn { color: #ef4444; }

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

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 60px 0;
  color: var(--text-muted, #94a3b8); font-size: 14px;
}

@media (max-width: 600px) {
  .ping-grid { grid-template-columns: 1fr 1fr; }
}
</style>