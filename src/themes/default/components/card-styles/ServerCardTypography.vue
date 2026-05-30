<template>
  <div class="server-card typography-card" @click="$emit('show-detail', server)">
    <div class="card-header">
      <div class="title-wrap">
        <span class="flag" :title="server.region">{{ getFlagEmoji(server.region) }}</span>
        <span class="name" :class="{ 'offline-text': !online }">{{ server.name }}</span>
      </div>
      <div class="header-right">
        <span class="uptime">{{ online ? shortUptime(server.uptime) : 'OFFLINE' }}</span>
        <span class="status-dot" :class="online ? 'online' : 'offline'"></span>
      </div>
    </div>

    <div class="dense-grid">
      <span class="lbl">CPU</span>
      <span class="val" :style="{ color: getColor(server.cpu) }">
        {{ online ? (server.cpu || 0).toFixed(1) + '%' : '-' }}
      </span>
      <span class="lbl">LOAD</span>
      <span class="val">{{ online ? `${(server.load_1||0).toFixed(2)} ${(server.load_5||0).toFixed(2)}` : '-' }}</span>

      <span class="lbl">MEM</span>
      <span class="val" :style="{ color: getColor(server.mem) }">
        {{ online ? `${formatBytes(server.mem_used)}/${formatBytes(server.mem_total)}` : '-' }}
      </span>
      <span class="lbl">SWAP</span>
      <span class="val">{{ online ? formatBytes(server.swap_used) : '-' }}</span>

      <span class="lbl">DSK</span>
      <span class="val" :style="{ color: getColor(server.disk) }">
        {{ online ? `${formatBytes(server.disk_used)}/${formatBytes(server.disk_total)}` : '-' }}
      </span>
      <span class="lbl">CONN</span>
      <span class="val">{{ online ? `T:${server.tcp_conn||0} U:${server.udp_conn||0}` : '-' }}</span>

      <span class="lbl">NET</span>
      <span class="val net-speed">
        <span class="tx" :class="{ offline: !online }">↑{{ online ? formatSpeedShort(server.net_tx_speed) : '0B' }}</span>
        <span class="rx" :class="{ offline: !online }">↓{{ online ? formatSpeedShort(server.net_rx_speed) : '0B' }}</span>
      </span>
      <span class="lbl">TOT</span>
      <span class="val traffic-tot">
        ↑{{ formatBytes(server.net_tx_total) }} ↓{{ formatBytes(server.net_rx_total) }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { isOnline, getFlagEmoji, formatSpeed, formatBytes } from '@/utils/format.js'

const props = defineProps({
  server: { type: Object, required: true }
})

defineEmits(['show-detail'])

const online = computed(() => isOnline(props.server.last_active))

const getColor = (val) => {
  if (!online.value) return 'var(--text-muted)'
  if (val >= 90) return '#ef4444'
  if (val >= 75) return '#f59e0b'
  return 'var(--text-main)'
}

const formatSpeedShort = (val) => {
  if (!val) return '0B'
  return formatSpeed(val).replace('/s', '').replace(' ', '')
}

const shortUptime = (seconds) => {
  if (!seconds) return '0d 0h'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  return `${d}d ${h}h`
}
</script>

<style scoped>
.typography-card {
  cursor: pointer;
  background: var(--surface-color);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  border: 1px solid var(--border-color);
  /* 👇 统一过渡动画时间 */
  transition: all 0.2s; 
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 👇 修正 1：采用新的悬浮效果，移除蓝色边框变色，改为上浮加阴影 */
.typography-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 8px;
  margin-bottom: 10px; /* 确保没有外部下边距 */
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 6px; /* 缩小了图标和文字的间距 */
}

.flag { font-size: 16px; }

/* 👇 修正 2：服务器名称字号增大，字重加粗 */
.name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.offline-text {
  color: var(--text-muted);
  text-decoration: line-through;
  opacity: 0.7;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.uptime {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 11px;
  color: var(--text-muted);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-dot.online { background-color: #10b981; }
.status-dot.offline { background-color: #ef4444; }

/* 核心：高密度网格排版 */
.dense-grid {
  display: grid;
  grid-template-columns: 28px 1fr 32px 1.25fr;
  column-gap: 4px;
  row-gap: 6px;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 10.5px; 
  align-items: center;
}

.lbl {
  color: var(--text-muted);
  font-weight: 600;
}

.val {
  color: var(--text-main);
  font-weight: 500;
  white-space: nowrap;
}

.net-speed {
  display: flex;
  gap: 4px;
}

.tx { color: #10b981; }
.rx { color: #3b82f6; }
.traffic-tot { 
  color: var(--text-muted); 
  letter-spacing: -0.3px; 
}

.tx.offline, .rx.offline {
  color: var(--text-muted);
}
</style>