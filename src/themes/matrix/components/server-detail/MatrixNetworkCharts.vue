<template>
  <div class="matrix-network-container">
    <div v-show="!networkStats || networkStats.length === 0" class="empty-state">
      <p>// 暂无延迟监测任务（NO_ACTIVE_PING_TASKS）</p>
    </div>

    <div v-show="networkStats && networkStats.length > 0" class="ping-dashboard-layout">
      <div class="chart-wrapper-node">
        <div class="chart-header">
          <span class="cmd-title">$ ping -c 10 --multi-backbone backbone.net</span>
        </div>
        <div class="chart-relative">
          <div ref="domPing" class="chart-wrap-network"></div>
          
          <button class="chart-legend-toggle" @click="$emit('toggle-legend')" :title="isAllHidden ? '显示全部' : '隐藏全部'">
            <svg v-if="isAllHidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-eye">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-eye">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
        </div>
      </div>

      <div class="terminal-table-section">
        <div class="table-cmd">$ icmp_diagnose --summary --tabular</div>
        
        <div class="ssh-grid-table">
          <div class="table-thead">
            <span class="col-node">节点名称 (NODE)</span>
            <span class="col-target">目标地址 (TARGET)</span>
            <span class="col-metric text-right">最新 (LAST)</span>
            <span class="col-metric text-right">丢包 (LOSS)</span>
            <span class="col-metric text-right">波动 (JITR)</span>
            <span class="col-metric text-right">平均 (AVG)</span>
          </div>
          
          <div v-for="item in networkStats" :key="item.target + item.nodeName" class="table-tbody-row">
            <span class="col-node" :style="{ color: item.themeColor }">● {{ item.nodeName }}</span>
            <span class="col-target">{{ item.target }}</span>
            <span class="col-metric text-right font-bold" :style="{ color: item.themeColor }">{{ item.latest }}</span>
            <span class="col-metric text-right" :class="{ 'text-danger': parseFloat(item.loss) > 0 }">{{ item.loss }}%</span>
            <span class="col-metric text-right">{{ item.jitter }}</span>
            <span class="col-metric text-right">{{ item.avg }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, toRef, onMounted, onUnmounted } from 'vue'
// 确保引用路径为你重构后的公共解耦目录
import { useEChart } from '@/composables/server-detail/useEChart.js'
import * as echarts from 'echarts'

const props = defineProps({
  pingSummaryData:  { type: Array, default: () => [] },
  mergedPingOption: { type: Object, default: () => ({}) },
  pingRawData:      { type: Array, default: () => [] },
  isAllHidden:      { type: Boolean, default: false },
})

const emit = defineEmits(['toggle-legend', 'legend-change'])
const domPing = ref(null)

useEChart(domPing, toRef(props, 'mergedPingOption'))

let chartInstance = null

const handleLegendChange = (params) => {
  const selected = params.selected || {}
  const keys = Object.keys(selected)
  const allHidden = keys.length > 0 && keys.every(k => selected[k] === false)
  emit('legend-change', allHidden)
}

onMounted(() => {
  setTimeout(() => {
    // 🌟 核心修复 2：增加防崩溃校验。如果 DOM 依然为 null，直接拦截，拒绝传递给 ECharts
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

const networkStats = computed(() =>
  props.pingSummaryData.map(item => {
    const raw = props.pingRawData.find(r => r.target === item.target)
    const rows = raw?.rows || []
    const validRows = rows.filter(r => (r.ping_ms ?? r.latency_ms) != null)
    const count = validRows.length

    let latest = 0, avg = 0, jitter = 0, loss = 0

    if (count > 0) {
      latest = validRows[count - 1].ping_ms ?? validRows[count - 1].latency_ms
      avg = validRows.reduce((sum, r) => sum + (r.ping_ms ?? r.latency_ms), 0) / count
      loss = rows.reduce((sum, r) => sum + (r.loss || 0), 0) / rows.length
      jitter = validRows.reduce((sum, r) => sum + (r.jitter || 0), 0) / count
    } else {
      loss = rows.length ? 100 : 0
    }

    return {
      nodeName: item.nodeName,
      target: item.target,
      themeColor: item.themeColor,
      latest: count > 0 ? latest.toFixed(1) + 'ms' : '超时',
      avg: count > 0 ? avg.toFixed(1) + 'ms' : '-',
      jitter: count > 0 ? jitter.toFixed(1) + 'ms' : '-',
      loss: loss.toFixed(1)
    }
  })
)
</script>

<style scoped>
.matrix-network-container { width: 100%; font-family: 'Courier New', Courier, monospace; }
.ping-dashboard-layout { display: flex; flex-direction: column; gap: 24px; }

.chart-wrapper {
  background: transparent;
  border: 1px solid #00ff8811;
  padding: 16px;
}
.chart-relative { position: relative; width: 100%; }
.chart-wrap-network { height: 260px; width: 100%; }

.chart-header {
  display: flex;
  margin-bottom: 12px;
}
.cmd-title { color: #00ff88; font-weight: 600; font-size: 13px; }

/* 命令行表单阵列结构 */
.terminal-table-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.table-cmd { color: #00ff88; font-weight: 600; }

.ssh-grid-table {
  display: flex;
  flex-direction: column;
  border: 1px dashed #00ff8815;
  padding: 8px 16px;
  background: rgba(0, 255, 136, 0.01);
}

.table-thead, .table-tbody-row {
  display: flex;
  align-items: center;
  padding: 8px 0;
  font-size: 12px;
}

.table-thead {
  color: #2a5a40;
  border-bottom: 1px dashed #00ff8822;
  font-weight: 600;
}

.table-tbody-row {
  color: #a0ffcc;
  border-bottom: 1px dashed #00ff8808;
}
.table-tbody-row:last-child { border-bottom: none; }

.col-node { flex: 1.5; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.col-target { flex: 2; color: #234d35; }
.col-metric { flex: 1; }

.text-right { text-align: right; }
.font-bold { font-weight: 600; }
.text-danger { color: #ff4455 !important; }

.empty-state { color: #1a4a2a; padding: 40px 0; font-size: 12px; }

.chart-legend-toggle {
  position: absolute;
  right: 8px;
  bottom: 4px;
  background: transparent;
  border: none;
  color: #2a5a40;
  cursor: pointer;
  z-index: 10;
}
.chart-legend-toggle:hover { color: #00ff88; }
.icon-eye { width: 14px; height: 14px; }

@media (max-width: 768px) {
  .table-thead { display: none; }
  .table-tbody-row { flex-wrap: wrap; gap: 4px 12px; padding: 12px 0; }
  .col-node, .col-target { flex: none; width: 100%; }
  .col-metric { flex: 1; text-align: left !important; }
}
</style>