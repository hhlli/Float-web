<!-- src/components/public/server-detail/ViewLoad.vue -->
<template>
  <div class="charts-grid">
    <BaseChartCard icon="🖥️" title="CPU" :currentValue="`${currentCPU}%`">
      <div class="chart-wrap" ref="domCPU" />
    </BaseChartCard>

    <BaseChartCard
      icon="🧠" title="内存"
      :currentValue="`${formatBytes(server?.mem_used)} / ${formatBytes(server?.mem_total)}`"
      :subHeader="`Swap: ${formatBytes(server?.swap_used)} / ${formatBytes(server?.swap_total)}`"
    >
      <div class="chart-wrap" ref="domMem" />
    </BaseChartCard>

    <BaseChartCard icon="💾" title="磁盘"
      :currentValue="`${formatBytes(server?.disk_used)} / ${formatBytes(server?.disk_total)}`">
      <div class="chart-wrap" ref="domDisk" />
    </BaseChartCard>

    <BaseChartCard icon="🌐" title="网络"
      :currentValue="`↑ ${formatSpeed(server?.net_tx_speed)}  ↓ ${formatSpeed(server?.net_rx_speed)}`">
      <div class="chart-wrap" ref="domNet" />
    </BaseChartCard>

    <BaseChartCard icon="🔗" title="连接数"
      :currentValue="`TCP: ${server?.tcp_conn ?? 0}  UDP: ${server?.udp_conn ?? 0}`">
      <div class="chart-wrap" ref="domConn" />
    </BaseChartCard>

    <BaseChartCard icon="⚡" title="进程"
      :currentValue="String(server?.processes ?? 0)">
      <div class="chart-wrap" ref="domProc" />
    </BaseChartCard>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BaseChartCard from '@/components/common/BaseChartCard.vue'
import { formatBytes, formatSpeed } from '@/composables/server-detail/chartUtils.js'
import { useEChart } from '@/composables/server-detail/useEChart.js'

const props = defineProps({
  server:     Object,
  currentCPU: [String, Number],
  cpuOption:  Object,
  memOption:  Object,
  diskOption: Object,
  netOption:  Object,
  connOption: Object,
  procOption: Object,
})

// 用 toRef 让 useEChart 能监听 prop 变化
import { toRef } from 'vue'

const domCPU  = ref(null)
const domMem  = ref(null)
const domDisk = ref(null)
const domNet  = ref(null)
const domConn = ref(null)
const domProc = ref(null)

useEChart(domCPU,  toRef(props, 'cpuOption'))
useEChart(domMem,  toRef(props, 'memOption'))
useEChart(domDisk, toRef(props, 'diskOption'))
useEChart(domNet,  toRef(props, 'netOption'))
useEChart(domConn, toRef(props, 'connOption'))
useEChart(domProc, toRef(props, 'procOption'))
</script>

<style scoped>
.charts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
}
.chart-wrap {
  width: 100%;
  height: 200px;
}
@media (max-width: 900px) { .charts-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .charts-grid { grid-template-columns: 1fr; } }
</style>