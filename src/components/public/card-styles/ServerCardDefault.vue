<template>
  <div class="server-card" @click="$emit('show-detail', server)">
    
    <div class="card-header-layout">
      <div class="header-left">
        <div class="title-group">
          <span class="flag-icon" :title="server.region">{{ getFlagEmoji(server.region) }}</span>
          <span class="server-name">{{ server.name }}</span>
        </div>
        <div class="tags-row" v-if="server.cost || server.billing_date">
          <span v-if="server.cost" class="tag tag-blue">{{ formatCurrency(server.cost, server.currency) }}/周期</span>
          <span v-if="server.billing_date" class="tag tag-green">{{ calculateDaysLeft(server.billing_date) }}</span>
        </div>
      </div>
      <div class="header-right">
        <span class="status-badge" :class="{ offline: !isOnline(server.last_active) }">
          {{ isOnline(server.last_active) ? 'Online' : 'Offline' }}
        </span>
      </div>
    </div>

    <div class="divider"></div>

    <div class="info-row os-row">
      <span class="label">OS</span>
      <span class="value os-value">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted);"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path><path d="M8.5 8.5v.01"></path><path d="M16 15.5v.01"></path><path d="M12 12v.01"></path><path d="M11 17v.01"></path><path d="M7 14v.01"></path></svg>
        {{ server.os || 'Unknown' }}
      </span>
    </div>

    <div class="metrics-container">
      
      <div class="metric-block">
        <div class="metric-text">
          <span class="label">CPU</span>
          <span class="value">{{ (server.cpu || 0).toFixed(1) }}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: (server.cpu || 0) + '%', background: getProgressColor(server.cpu) }"></div>
        </div>
      </div>

      <div class="metric-block">
        <div class="metric-text">
          <span class="label">RAM</span>
          <span class="value">{{ (server.mem || 0).toFixed(1) }}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: (server.mem || 0) + '%', background: getProgressColor(server.mem) }"></div>
        </div>
        <div class="metric-subtext">
          ({{ formatBytes(server.mem_used) }} / {{ formatBytes(server.mem_total) }})
        </div>
      </div>

      <div class="metric-block">
        <div class="metric-text">
          <span class="label">Disk</span>
          <span class="value">{{ (server.disk || 0).toFixed(1) }}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: (server.disk || 0) + '%', background: getProgressColor(server.disk) }"></div>
        </div>
        <div class="metric-subtext">
          ({{ formatBytes(server.disk_used) }} / {{ formatBytes(server.disk_total) }})
        </div>
      </div>

      <div class="metric-block" v-if="server.monthly_bw > 0">
        <div class="metric-text">
          <span class="label">Traffic</span>
          <span class="value">{{ getTrafficPercent(server) }}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: getTrafficPercent(server) + '%', background: '#10b981' }"></div>
        </div>
        <div class="metric-subtext">
          ({{ formatBytes((server.net_tx_total || 0) + (server.net_rx_total || 0)) }} / {{ server.monthly_bw }} GB) • ↑ {{ formatBytes(server.net_tx_total) }} ↓ {{ formatBytes(server.net_rx_total) }}
        </div>
      </div>

    </div>

    <div class="bottom-stats">
      <div class="info-row">
        <span class="label">Net Spd</span>
        <span class="value">↑ {{ formatSpeed(server.net_tx_speed) }} ↓ {{ formatSpeed(server.net_rx_speed) }}</span>
      </div>
      <div class="info-row">
        <span class="label">Uptime</span>
        <span class="value">{{ formatUptime(server.uptime) }}</span>
      </div>
    </div>

  </div>
</template>

<script setup>
const props = defineProps({
  server: {
    type: Object,
    required: true
  }
})

defineEmits(['show-detail'])

const isOnline = (lastActive) => {
  if (!lastActive) return false
  return (Date.now() / 1000) - lastActive < 180
}

const getFlagEmoji = (countryCode) => {
  if (!countryCode || countryCode === 'UN' || countryCode === '-') return '🌐'
  try {
    return String.fromCodePoint(...countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0)))
  } catch (e) {
    return '🌐'
  }
}

const getProgressColor = (percent) => {
  const p = percent || 0
  if (p > 90) return '#ef4444' 
  if (p > 75) return '#f59e0b' 
  return 'var(--primary-color)' 
}

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatSpeed = (bytes) => formatBytes(bytes) + '/s'

const formatUptime = (seconds) => {
  if (!seconds) return '0s'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d} day ${h} h ${m} min`
  return `${h} h ${m} min`
}

const formatCurrency = (cost, currency) => {
  const symbols = { 'CNY': '¥', 'USD': '$', 'EUR': '€' }
  return `${symbols[currency] || ''}${cost}`
}

const calculateDaysLeft = (dateStr) => {
  if (!dateStr) return ''
  const target = new Date(dateStr).getTime()
  const now = new Date().getTime()
  const diff = target - now
  if (diff < 0) return '已过期'
  const days = Math.ceil(diff / (1000 * 3600 * 24))
  return `${days} day${days > 1 ? 's' : ''}`
}

const getTrafficPercent = (s) => {
  if (!s.monthly_bw || s.monthly_bw <= 0) return 0
  const used = (s.net_tx_total || 0) + (s.net_rx_total || 0)
  const total = s.monthly_bw * 1024 * 1024 * 1024
  const p = (used / total) * 100
  return p > 100 ? 100 : p.toFixed(1)
}
</script>

<style scoped>
/* 卡片基础布局 */
.server-card {
  cursor: pointer;
  background: var(--surface-color, #ffffff);
  border-radius: var(--radius-lg, 16px);
  padding: 20px 24px;
  border: 1px solid var(--border-color, #e2e8f0);
  box-shadow: var(--shadow-sm, 0 4px 20px rgba(0, 0, 0, 0.03));
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.server-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
  border-color: rgba(59, 130, 246, 0.2);
}

/* 头部排版 */
.card-header-layout {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flag-icon {
  font-size: 18px;
  line-height: 1;
  border-radius: 2px;
  overflow: hidden;
}

.server-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: -0.2px;
}

.tags-row {
  display: flex;
  gap: 8px;
}

.tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.tag-blue { background: rgba(59, 130, 246, 0.1); color: #2563eb; }
.tag-green { background: rgba(22, 163, 74, 0.1); color: #16a34a; }

.status-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  background: rgba(22, 163, 74, 0.1);
  color: #16a34a;
}
.status-badge.offline {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.divider {
  height: 1px;
  background-color: var(--border-color, #e2e8f0);
  margin: 16px 0;
}

/* 行信息排版 */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  margin-bottom: 12px;
}
.info-row:last-child {
  margin-bottom: 0;
}
.info-row .label {
  color: var(--text-muted);
}
.info-row .value {
  color: var(--text-main);
  font-weight: 500;
}

.os-row {
  margin-bottom: 16px;
}
.os-value {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 进度条组排版 */
.metrics-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

.metric-block {
  display: flex;
  flex-direction: column;
}

.metric-text {
  display: flex;
  justify-content: space-between;
  font-size: 15px;
  margin-bottom: 6px;
}
.metric-text .label {
  color: var(--text-muted);
}
.metric-text .value {
  color: var(--text-main);
  font-weight: 600;
}

.progress-track {
  height: 6px;
  background: var(--border-color, #e2e8f0);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease, background-color 0.4s ease;
}

.metric-subtext {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 6px;
}

/* 底部状态区 */
.bottom-stats {
  margin-top: auto;
}
</style>