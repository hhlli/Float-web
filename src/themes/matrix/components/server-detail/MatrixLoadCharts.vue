<template>
  <div class="matrix-charts-grid">
    <div class="chart-block">
      <div class="chart-header">
        <span class="cmd-title">$ sysstat --live --cpu</span>
        <span class="realtime-val">实时: {{ currentCPU }}%</span>
      </div>
      <div class="chart-wrap" ref="domCPU" />
    </div>

    <div class="chart-block">
      <div class="chart-header">
        <span class="cmd-title">$ sysstat --live --memory</span>
        <span class="realtime-val">使用: {{ formatBytes(server?.mem_used) }} / {{ formatBytes(server?.mem_total) }}</span>
      </div>
      <div class="chart-wrap" ref="domMem" />
    </div>

    <div class="chart-block">
      <div class="chart-header">
        <span class="cmd-title">$ df -h --io-pool</span>
        <span class="realtime-val">容量: {{ formatBytes(server?.disk_used) }} / {{ formatBytes(server?.disk_total) }}</span>
      </div>
      <div class="chart-wrap" ref="domDisk" />
    </div>

    <div class="chart-block">
      <div class="chart-header">
        <span class="cmd-title">$ iftop -i net0 --band</span>
        <span class="realtime-val">▲ {{ formatSpeed(server?.net_tx_speed) }}  ▼ {{ formatSpeed(server?.net_rx_speed) }}</span>
      </div>
      <div class="chart-wrap" ref="domNet" />
    </div>

    <div class="chart-block">
      <div class="chart-header">
        <span class="cmd-title">$ netstat -an | wc -l</span>
        <span class="realtime-val">TCP: {{ server?.tcp_conn ?? 0 }}  UDP: {{ server?.udp_conn ?? 0 }}</span>
      </div>
      <div class="chart-wrap" ref="domConn" />
    </div>

    <div class="chart-block">
      <div class="chart-header">
        <span class="cmd-title">$ ps -ef | expr tasks</span>
        <span class="realtime-val">活跃进程: {{ server?.processes ?? 0 }}</span>
      </div>
      <div class="chart-wrap" ref="domProc" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, toRef } from 'vue'
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
.matrix-charts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 🌟 默认每行 3 个图表 */
  gap: 24px 32px;
  width: 100%;
  box-sizing: border-box;
}

.chart-block {
  display: flex;
  flex-direction: column;
  background: transparent;
  border: none;       /* 🌟 移除所有负载块的边框 */
  box-shadow: none;   /* 🌟 移除内阴影 */
  padding: 8px 0;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
  font-family: 'Courier New', Courier, monospace;
}

.cmd-title {
  color: #00ff88;
  font-weight: 600;
  font-size: 13px;
}

.realtime-val {
  color: #a0ffcc;
  font-size: 12px;
}

.chart-wrap {
  width: 100%;
  height: 180px;
}

/* 🌟 动态自适应媒体查询断点 */
@media (max-width: 1400px) {
  .matrix-charts-grid { grid-template-columns: repeat(2, 1fr); } /* 空间变窄时自动切换到每行 2 个 */
}
@media (max-width: 850px) {
  .matrix-charts-grid { grid-template-columns: 1fr; }           /* 移动端或极窄空间切换为单列 */
}
</style>