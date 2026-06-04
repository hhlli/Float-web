<template>
  <div class="tab-overview-container">
    <div class="info-grid">
      <div class="info-card text-card">
        <h3>状态总览</h3>
        <div v-for="(val, label) in serverStatusMap" :key="label" class="text-group">
          <label>{{ label }}</label>
          <div class="value">{{ val }}</div>
        </div>
      </div>

      <div class="info-card resource-card">
        <h3>资源使用情况</h3>
        <div class="metric-list">
          <div v-for="(item, index) in resources" :key="index" class="metric-block">
            <div class="metric-text">
              <span class="label">{{ item.label }}</span>
              <span class="value">{{ item.value }}</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: item.percent + '%', background: item.color }"></div>
            </div>
            <div v-if="item.subtext" class="metric-subtext">{{ item.subtext }}</div>
          </div>
        </div>
      </div>

      <div class="info-card text-card">
        <h3>系统信息</h3>
        <div v-for="item in systemInfo" :key="item.label" class="text-group">
          <label>{{ item.label }}</label>
          <div class="value">{{ item.value }}</div>
        </div>
      </div>

      <div class="info-card text-card">
        <h3>硬件信息</h3>
        <div v-for="item in hardwareInfo" :key="item.label" class="text-group">
          <label>{{ item.label }}</label>
          <div class="value">{{ item.value }}</div>
        </div>
      </div>

      <div class="info-card text-card network-card">
        <h3>网络信息</h3>
        <div class="text-group">
          <label>网络</label>
          <div class="value speed-val">↑ {{ netInfo.speedTx }}<br>↓ {{ netInfo.speedRx }}</div>
        </div>
        <div class="text-group">
          <label>总流量</label>
          <div class="value speed-val">↑ {{ netInfo.totalTx }}<br>↓ {{ netInfo.totalRx }}</div>
        </div>
        <div class="text-group">
          <label>连接数</label>
          <div class="value">TCP: {{ netInfo.tcp }}, UDP: {{ netInfo.udp }}</div>
        </div>
      </div>

      <div class="info-card latency-card-wrapper">
        <h3>三网延迟</h3>
        <TabOverviewLatency :server="server" />
      </div>

      <div class="info-card load-card-wrapper">
        <h3>平均负载</h3>
        <TabOverviewLoad :server="server" />
      </div>

      <div class="info-card uptime-card-wrapper">
        <h3>24H 在线</h3>
        <div class="heatmap-container">
          <Heatmap24H 
            :history="server?.history_24h || []" 
            :sla="server?.sla_24h || '0.00'" 
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import TabOverviewLatency from '@/components/common/TabOverviewLatency.vue'
import TabOverviewLoad from '@/components/common/TabOverviewLoad.vue'
import Heatmap24H from '@/components/common/Heatmap24H.vue'
import {
  formatBytes,
  formatSpeed,
  formatUptime,
  getProgressColor,
  formatOS,
  getTrafficPercent
} from '@/utils/format.js'

const props = defineProps({
  server: Object
})

const serverStatusMap = computed(() => {
  const s = props.server || {}
  return {
    '版本': s.agent_version || '-',
    '运行时间': formatUptime(s.uptime),
    '最后上报': s.last_active ? new Date(s.last_active * 1000).toLocaleString() : '-',
    '进程': s.processes || 0
  }
})

const resources = computed(() => {
  const s = props.server || {}
  const cpuVal = Number(s.cpu || 0)
  const memP = (s.mem_used / s.mem_total * 100) || 0
  const diskP = (s.disk_used / s.disk_total * 100) || 0
  const swapP = (s.swap_used / s.swap_total * 100) || 0
  const trafficP = Number(getTrafficPercent(s))
  
  const netTotal = (s.net_tx_total || 0) + (s.net_rx_total || 0)
  return [
    { label: 'CPU', value: `${cpuVal.toFixed(1)}%`, percent: cpuVal, color: getProgressColor(cpuVal) },
    { label: '内存', value: `${formatBytes(s.mem_used)} / ${formatBytes(s.mem_total)}`, percent: memP, color: getProgressColor(memP) },
    { label: '磁盘', value: `${formatBytes(s.disk_used)} / ${formatBytes(s.disk_total)}`, percent: diskP, color: getProgressColor(diskP) },
    { label: '交换区 (Swap)', value: `${formatBytes(s.swap_used)} / ${formatBytes(s.swap_total)}`, percent: swapP, color: getProgressColor(swapP) },
    { label: '流量限制', value: `${trafficP.toFixed(1)}%`, percent: trafficP, color: getProgressColor(trafficP), subtext: `(${formatBytes(netTotal)} / ${s.monthly_bw || '无限制'} GB)` }
  ]
})

const systemInfo = computed(() => {
  const s = props.server || {}
  return [
    { label: '操作系统', value: formatOS(s.os) },
    { label: '内核版本', value: s.kernel || 'Unknown' },
    { label: '架构', value: s.arch || 'amd64' },
    { label: '虚拟化', value: s.virt || 'kvm' }
  ]
})

const hardwareInfo = computed(() => {
  const s = props.server || {}
  return [
    { label: 'CPU', value: s.cpu_model || 'Unknown Processor' },
    { label: 'GPU', value: s.gpu_model || 'None' },
    { label: '内存', value: formatBytes(s.mem_total) },
    { label: '磁盘', value: formatBytes(s.disk_total) }
  ]
})

const netInfo = computed(() => {
  const s = props.server || {}
  return {
    speedTx: formatSpeed(s.net_tx_speed),
    speedRx: formatSpeed(s.net_rx_speed),
    totalTx: formatBytes(s.net_tx_total),
    totalRx: formatBytes(s.net_rx_total),
    tcp: s.tcp_conn || 0,
    udp: s.udp_conn || 0
  }
})
</script>

<style scoped>
.tab-overview-container { display: flex; flex-direction: column; gap: 16px; }

/* 网格布局：5 列 */
.info-grid { 
  display: grid; 
  grid-template-columns: 1fr 1.5fr 1fr 1fr 1fr; 
  gap: 16px; 
}

/* 底部布局分配 */
.latency-card-wrapper {
  grid-column: 1 / 4; /* 延迟占前 3 列 */
}
.load-card-wrapper {
  grid-column: 4 / 5; /* 负载占第 4 列 */
}
.uptime-card-wrapper {
  grid-column: 5 / 6; /* 24小时在线占第 5 列 */
}

.info-card { 
  background: var(--surface-color); 
  border: 1px solid var(--border-color); 
  border-radius: 12px; 
  padding: 24px; 
  display: flex; 
  flex-direction: column; 
}
.info-card h3 { 
  font-size: 15px; 
  color: var(--text-muted); 
  margin: 0 0 20px 0; 
  font-weight: 500; 
}

.metric-list { display: flex; flex-direction: column; gap: 16px; }
.metric-text { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; font-weight: 600; }
.progress-track { height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; transition: width 0.4s ease; }
.metric-subtext { font-size: 12px; color: var(--text-muted); margin-top: 6px; }

.text-group { margin-bottom: 16px; }
.text-group:last-child { margin-bottom: 0; }
.text-group label { display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px; }
.text-group .value { font-size: 14px; font-weight: 600; }
.speed-val { line-height: 1.5; }

.heatmap-container {
  flex: 1;
  display: flex;
  align-items: center; /* 垂直居中热力图，适配卡片高度 */
}

/* 响应式断点调整 */
@media (max-width: 1400px) {
  .info-grid { grid-template-columns: repeat(3, 1fr); }
  .latency-card-wrapper { grid-column: 1 / -1; }
  .load-card-wrapper { grid-column: 1 / 2; }
  .uptime-card-wrapper { grid-column: 2 / 4; }
}
@media (max-width: 1200px) {
  .info-grid { grid-template-columns: repeat(2, 1fr); }
  .latency-card-wrapper { grid-column: 1 / -1; }
  .load-card-wrapper { grid-column: 1 / -1; }
  .uptime-card-wrapper { grid-column: 1 / -1; }
}
@media (max-width: 768px) {
  .info-grid { grid-template-columns: 1fr; }
}

</style>