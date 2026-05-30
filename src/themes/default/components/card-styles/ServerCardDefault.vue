<template>
  <div 
  :class="['server-card', { 'is-offline': !isOnline(server.last_active) }]" 
  @click="$emit('show-detail', server)"
>
    
    <div class="card-header-layout">
      <div class="header-main">
        <div class="title-group">
          <span class="flag-icon" :title="server.region">{{ getFlagEmoji(server.region) }}</span>
          <span class="server-name">{{ server.name }}</span>
        </div>
        <StatusBadge :online="isOnline(server.last_active)" />
      </div>
      
      <div class="header-sub">
        <div class="sub-left">
          <span v-if="server.cost != null && server.cost !== ''" class="blue-text">
            {{ Number(server.cost) === 0 ? '免费' : formatCurrency(server.cost, server.currency) + '/' + (cycleMap[server.billing_cycle] || '月') }}
          </span>
          <span v-if="server.billing_date" :class="isExpiring(server.billing_date) ? 'expire-warn' : 'green-text'">
            {{ shortDaysLeft(server.billing_date) }}
          </span>
          <span v-if="(server.cost == null || server.cost === '') && !server.billing_date" class="text-placeholder">-</span>
        </div>
        <div class="sub-right">
          {{ shortUptime(server.uptime) }}
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="os-row">
      <span class="label">OS</span>
      <span class="value">
        <svg class="os-icon" width="16" height="16" aria-hidden="true">
          <use :href="getOsIcon(server.os)"></use>
        </svg>
        {{ formatOS(server.os) }}
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
          <span class="label">内存</span>
          <span class="value">{{ (server.mem || 0).toFixed(1) }}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: (server.mem || 0) + '%', background: getProgressColor(server.mem) }"></div>
        </div>
        <div class="metric-subtext">({{ formatBytes(server.mem_used) }} / {{ formatBytes(server.mem_total) }})</div>
      </div>

      <div class="metric-block">
        <div class="metric-text">
          <span class="label">磁盘</span>
          <span class="value">{{ (server.disk || 0).toFixed(1) }}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: (server.disk || 0) + '%', background: getProgressColor(server.disk) }"></div>
        </div>
        <div class="metric-subtext">({{ formatBytes(server.disk_used) }} / {{ formatBytes(server.disk_total) }})</div>
      </div>

      <div class="metric-block">
        <div class="metric-text">
          <span class="label">流量限制</span>
          <span class="value">{{ getTrafficPercent(server) }}%</span>
        </div>
        <div class="progress-track">
  <div class="progress-fill" :style="{ width: (server.monthly_bw > 0 ? getTrafficPercent(server) : 0) + '%', background: getProgressColor(getTrafficPercent(server)) }"></div>
</div>
        <div class="metric-subtext traffic-subtext">
  <span class="sub-left">{{ server.monthly_bw > 0 ? server.monthly_bw + ' GB' : '♾️' }}</span>
  <span class="sub-right">↑ {{ formatBytes(server.net_tx_total) }} ↓ {{ formatBytes(server.net_rx_total) }}</span>
</div>
      </div>
    </div>

    <div class="net-stats-split">
      <div class="net-val"><span class="arr-up">↑</span> {{ formatSpeed(server.net_tx_speed) }}</div>
      <div class="net-val"><span class="arr-down">↓</span> {{ formatSpeed(server.net_rx_speed) }}</div>
    </div>

  </div>
</template>

<script setup>
import StatusBadge from '@/components/common/StatusBadge.vue'
import {
  formatBytes, formatSpeed, formatCurrency, 
  isOnline, getFlagEmoji, formatOS, 
  getOsIcon, getProgressColor, getTrafficPercent
} from '@/utils/format.js'

const props = defineProps({
  server: { type: Object, required: true }
})

defineEmits(['show-detail'])

const cycleMap = { month: 'm', quarter: 'q', year: 'y' }

const isExpiring = (dateStr) => {
  if (!dateStr) return false
  const diff = new Date(dateStr).getTime() - new Date().getTime()
  return diff > 0 && diff < 7 * 24 * 3600 * 1000
}

const shortUptime = (seconds) => {
  if (!seconds) return '00:00'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const pad = (n) => n.toString().padStart(2, '0')
  if (d > 0) return `${d}d ${pad(h)}:${pad(m)}`
  return `${pad(h)}:${pad(m)}`
}

const shortDaysLeft = (dateStr) => {
  if (!dateStr) return ''
  const target = new Date(dateStr).getTime()
  const now = new Date().getTime()
  const diff = target - now
  if (diff < 0) return 'Expired'
  const days = Math.ceil(diff / (1000 * 3600 * 24))
  return `${days}d`
}
</script>

<style scoped>
.server-card {
  cursor: pointer;
  background: var(--surface-color);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.server-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
  border-color: rgba(59, 130, 246, 0.2);
}

.card-header-layout {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  overflow: visible; 
  display: inline-block;
}

.server-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: -0.2px;
}

.header-sub {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
}

.sub-left { 
  display: flex; 
  align-items: baseline;
  gap: 12px; 
}

.blue-text { color: #3b82f6; }
.green-text { color: #10b981; }
.expire-warn { color: #ef4444; }
.text-placeholder { opacity: 0.3; }

.divider {
  height: 1px;
  background-color: var(--border-color);
  margin: 12px 0;
}

.os-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 13px;
}
.os-row .label { color: var(--text-muted); font-weight: 500; }
.os-row .value { 
  color: var(--text-main); 
  font-weight: 500; 
  display: flex; 
  align-items: center; 
  gap: 6px; 
}
.os-icon { 
  flex-shrink: 0; 
  fill: currentColor; 
  overflow: visible;
  display: inline-block;
}

.metrics-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.net-stats-split {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px 0;
  padding-top: 16px;
  border-top: 1px solid var(--border-color); /* 此处改为 solid */
}

.net-val {
  font-size: 13px;
  color: var(--text-main);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  display: flex;
  align-items: center;
  gap: 6px;
}

.arr-up { color:rgb(17, 171, 86); font-weight: 900; } 
.arr-down { color:rgb(219, 41, 65); font-weight: 900; } 

.metric-block {
  display: flex;
  flex-direction: column;
}

.metric-text {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.metric-text .label {
  color: var(--text-muted);
  font-weight: 600;
  font-size: 13px;
}

.metric-text .value {
  color: var(--text-main);
  font-weight: 600;
  font-size: 13px;
}

.progress-track {
  height: 6px;
  background: var(--border-color);
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
.traffic-subtext {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>