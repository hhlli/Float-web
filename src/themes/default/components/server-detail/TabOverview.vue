<template>
  <div class="tab-overview-container">
    <div class="status-overview-card">
      <div v-for="(val, label) in serverStatusMap" :key="label" class="status-item">
        <span class="label">{{ label }}</span>
        <span class="value" :class="{ 'load-val': label === '负载 (1m/5m/15m)' }">{{ val }}</span>
      </div>
    </div>

    <div class="info-grid">
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

      <div v-for="section in staticSections" :key="section.title" class="info-card text-card">
        <h3>{{ section.title }}</h3>
        <div v-for="item in section.items" :key="item.label" class="text-group">
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
        <div class="text-group mt-auto">
          <label>三网延迟</label>
          <div class="value">
            <OverviewLatency :server="server" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import OverviewLatency from '@/components/common/OverviewLatency.vue'
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
    '进程': s.processes || 0,
    '负载 (1m/5m/15m)': `${(s.load_1 || 0).toFixed(2)} / ${(s.load_5 || 0).toFixed(2)} / ${(s.load_15 || 0).toFixed(2)}`
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

const staticSections = computed(() => {
  const s = props.server || {}
  return [
    {
      title: '系统信息',
      items: [
        { label: '操作系统', value: formatOS(s.os) },
        { label: '内核版本', value: s.kernel || 'Unknown' },
        { label: '架构', value: s.arch || 'amd64' },
        { label: '虚拟化', value: s.virt || 'kvm' }
      ]
    },
    {
      title: '硬件信息',
      items: [
        { label: 'CPU', value: s.cpu_model || 'Unknown Processor' },
        { label: 'GPU', value: s.gpu_model || 'None' },
        { label: '内存', value: formatBytes(s.mem_total) },
        { label: '磁盘', value: formatBytes(s.disk_total) }
      ]
    }
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

.status-overview-card { display: flex; flex-wrap: wrap; gap: 24px; background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px 24px; }
.status-item { flex: 1; min-width: 140px; display: flex; flex-direction: column; gap: 8px; border-right: 1px solid var(--border-color); }
.status-item:last-child { border-right: none; }
.status-item .label { font-size: 14px; color: var(--text-muted); }
.status-item .value { font-size: 15px; font-weight: 600; color: var(--text-main); }
.load-val { font-family: monospace; }

/* 网格比例调整：两侧宽(1.5fr)，中间窄(1fr) */
.info-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1.5fr; gap: 16px; }

.info-card { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; padding: 24px; display: flex; flex-direction: column; }
.info-card h3 { font-size: 15px; color: var(--text-muted); margin: 0 0 20px 0; font-weight: 500; }

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

/* 使三网延迟靠底部对齐 */
.mt-auto { margin-top: auto; }

@media (max-width: 1200px) {
  .info-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .info-grid { grid-template-columns: 1fr; }
  .status-overview-card { flex-direction: column; }
  .status-item { border-right: none; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; }
}
</style>