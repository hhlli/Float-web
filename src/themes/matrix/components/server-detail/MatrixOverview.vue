<template>
  <div class="matrix-overview-wrapper">
    <div class="overview-column">
      <div class="terminal-section">
        <div class="section-cmd">$ cat /var/log/agent/status.env</div>
        <div class="ssh-table">
          <div v-for="(val, label) in serverStatusMap" :key="label" class="table-row">
            <span class="table-key">{{ label.toUpperCase() }}</span>
            <span class="table-dots">....................</span>
            <span class="table-val select-text">{{ val }}</span>
          </div>
        </div>
      </div>

      <div v-if="staticSections[0]" class="terminal-section">
        <div class="section-cmd">$ cat /proc/{{ staticSections[0].title }}</div>
        <div class="ssh-table">
          <div v-for="item in staticSections[0].items" :key="item.label" class="table-row">
            <span class="table-key">{{ item.label.replace(' ', '_') }}</span>
            <span class="table-dots">....................</span>
            <span class="table-val select-text">{{ item.value }}</span>
          </div>
        </div>
      </div>

      <div class="terminal-section">
        <div class="section-cmd">$ ifconfig --stats net0</div>
        <div class="ssh-table">
          <div class="table-row">
            <span class="table-key">发送速率_TX</span>
            <span class="table-dots">....................</span>
            <span class="table-val alert-warn">▲ {{ netInfo.speedTx }}</span>
          </div>
          <div class="table-row">
            <span class="table-key">接收速率_RX</span>
            <span class="table-dots">....................</span>
            <span class="table-val alert-ok">▼ {{ netInfo.speedRx }}</span>
          </div>
          <div class="table-row">
            <span class="table-key">总出网流量_TX</span>
            <span class="table-dots">....................</span>
            <span class="table-val">{{ netInfo.totalTx }}</span>
          </div>
          <div class="table-row">
            <span class="table-key">总入网流量_RX</span>
            <span class="table-dots">....................</span>
            <span class="table-val">{{ netInfo.totalRx }}</span>
          </div>
          <div class="table-row">
            <span class="table-key">活动连接数</span>
            <span class="table-dots">....................</span>
            <span class="table-val text-blue">TCP:{{ netInfo.tcp }} / UDP:{{ netInfo.udp }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="overview-column">
      <div class="terminal-section">
        <div class="section-cmd">$ monitor --live --resource-usage</div>
        <div class="ascii-metric-list">
          <div v-for="(item, index) in resources" :key="index" class="ascii-metric-block">
            <div class="metric-header">
              <span class="label">{{ item.label }}</span>
              <span class="value" :style="{ color: getMatrixColor(item.label, item.percent) }">{{ item.value }}</span>
            </div>
            <div class="ascii-bar-wrapper" :style="{ color: getMatrixColor(item.label, item.percent) }">
              {{ renderAsciiBar(item.percent) }}
            </div>
            <div v-if="item.subtext" class="metric-subtext">> {{ item.subtext }}</div>
          </div>
        </div>
      </div>

      <div v-if="staticSections[1]" class="terminal-section">
        <div class="section-cmd">$ cat /proc/{{ staticSections[1].title }}</div>
        <div class="ssh-table">
          <div v-for="item in staticSections[1].items" :key="item.label" class="table-row">
            <span class="table-key">{{ item.label.replace(' ', '_') }}</span>
            <span class="table-dots">....................</span>
            <span class="table-val select-text">{{ item.value }}</span>
          </div>
        </div>
      </div>

      <div class="terminal-section ping-section">
        <div class="section-cmd">$ ping -c 3 matrix.backbone.net</div>
        <div class="latency-container">
          <OverviewLatency :server="server" />
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
  formatOS,
  getTrafficPercent
} from '@/utils/format.js'

const props = defineProps({
  server: { type: Object, required: true },
  onlineThreshold: { type: Number, default: 180 }
})

const serverStatusMap = computed(() => {
  const s = props.server || {}
  return {
    '探针版本': s.agent_version || '-',
    '运行时间': formatUptime(s.uptime),
    '最后上报': s.last_active ? new Date(s.last_active * 1000).toLocaleString() : '-',
    '进程任务': s.processes || 0,
    '系统负载': `${(s.load_1 || 0).toFixed(2)} / ${(s.load_5 || 0).toFixed(2)} / ${(s.load_15 || 0).toFixed(2)}`
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
    { label: 'CPU_使用率', value: `${cpuVal.toFixed(1)}%`, percent: cpuVal },
    { label: '内存使用率', value: `${formatBytes(s.mem_used)} / ${formatBytes(s.mem_total)}`, percent: memP },
    { label: '磁盘使用率', value: `${formatBytes(s.disk_used)} / ${formatBytes(s.disk_total)}`, percent: diskP },
    { label: '交换区使用率', value: `${formatBytes(s.swap_used)} / ${formatBytes(s.swap_total)}`, percent: swapP },
    { label: '月度流量限制', value: `${trafficP.toFixed(1)}%`, percent: trafficP, subtext: `(${formatBytes(netTotal)} / ${s.monthly_bw || '无限制'} GB)` }
  ]
})

const staticSections = computed(() => {
  const s = props.server || {}
  return [
    {
      title: 'sys_kernel',
      items: [
        { label: '操作系统', value: formatOS(s.os) },
        { label: '内核版本', value: s.kernel || '未知' },
        { label: '系统架构', value: s.arch || 'amd64' },
        { label: '虚拟化类型', value: s.virt || 'kvm' }
      ]
    },
    {
      title: 'cpuinfo',
      items: [
        { label: 'CPU_型号', value: s.cpu_model || '未知处理器' },
        { label: 'GPU_型号', value: s.gpu_model || '无' },
        { label: '内存总容量', value: formatBytes(s.mem_total) },
        { label: '磁盘总容量', value: formatBytes(s.disk_total) }
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

const renderAsciiBar = (percent) => {
  const totalBlocks = 20
  const filledBlocks = Math.min(totalBlocks, Math.max(0, Math.round((percent / 100) * totalBlocks)))
  return `[${'#'.repeat(filledBlocks)}${'-'.repeat(totalBlocks - filledBlocks)}]`
}

const getMatrixColor = (label, val) => {
  if (val > 85) return '#ff4455'
  if (val > 60) return '#f59e0b'
  return '#00ff88'
}
</script>

<style scoped>
/* 🌟 主包裹层改为 Flex 横向分列，从根本上杜绝行间高度绑定的空白间隙 */
.matrix-overview-wrapper {
  display: flex;
  gap: 40px;
  width: 100%;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;           /* 🌟 锁死基准字号 */
  line-height: 1.4;
}

/* 🌟 左右两个垂直流列 */
.overview-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;                 /* 纵向小模块之间的紧凑间距 */
  min-width: 0;
}

.terminal-section { 
  display: flex; 
  flex-direction: column; 
  gap: 6px; 
}

/* 🌟 严格限制所有子项字号均为 12px，避免产生大字体 */
.section-cmd { color: #00ff88; font-weight: 600; font-size: 12px; }
.ssh-table { display: flex; flex-direction: column; gap: 4px; padding-left: 12px; }
.table-row { display: flex; align-items: baseline; justify-content: flex-start; width: 100%; font-size: 12px; }
.table-key { color: #2a5a40; flex-shrink: 0; font-size: 12px; }
.table-dots { color: #081a10; flex: 1; overflow: hidden; white-space: nowrap; letter-spacing: 2px; padding: 0 4px; }
.table-val { color: #a0ffcc; font-weight: 600; flex-shrink: 0; text-align: right; font-size: 12px; }
.select-text { user-select: text; }

.ascii-metric-list { display: flex; flex-direction: column; gap: 10px; padding-left: 12px; }
.ascii-metric-block { display: flex; flex-direction: column; gap: 2px; }
.metric-header { display: flex; justify-content: space-between; font-size: 12px; }
.metric-header .label { color: #2a5a40; }
.ascii-bar-wrapper { font-weight: 700; letter-spacing: 1px; font-size: 12px; }
.metric-subtext { color: #1a4a2a; font-size: 11px; margin-top: 1px; }

.alert-ok { color: #00ff88; }
.alert-warn { color: #f59e0b; }
.text-blue { color: #4a90e2; }
.latency-container { padding-left: 12px; }

/* 窄屏或响应式降级 */
@media (max-width: 1024px) {
  .matrix-overview-wrapper {
    flex-direction: column;
    gap: 20px;
  }
}
</style>