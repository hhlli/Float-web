<template>
  <div class="dash-card" @click="$emit('show-detail', server)">
    
    <div class="dash-header">
      <div class="name-group">
        <span class="flag">{{ getFlagEmoji(server.region) }}</span>
        <span class="name">{{ server.name }}</span>
      </div>
      <div class="header-right">
        <div class="tags" v-if="server.billing_date">
          <span class="tag-expiry">{{ calculateDaysLeft(server.billing_date) }}</span>
        </div>
        <div class="status-indicator" :class="{ offline: !online }"></div>
      </div>
    </div>

    <div class="main-gauges">
      <div class="gauge-box" v-for="g in gauges" :key="g.label">
        <div class="ring-wrapper">
          <svg viewBox="0 0 36 36" class="gauge-svg">
            <circle class="ring-bg" cx="18" cy="18" r="15.9" fill="none" stroke-width="3"/>
            <circle
              class="ring-fill"
              cx="18" cy="18" r="15.9" fill="none" stroke-width="3"
              :stroke="g.color"
              stroke-linecap="round"
              :stroke-dasharray="`${Number(g.pct) || 0} 100`"
              pathLength="100"
            />
          </svg>
          <div class="ring-content">
            <span class="pct-num" :style="{ color: g.color }">{{ Math.round(Number(g.pct) || 0) }}<small>%</small></span>
          </div>
        </div>
        <span class="gauge-label">{{ g.label }}</span>
      </div>
    </div>

    <div class="dash-footer">
      <div class="traffic-mini" v-if="trafficInfo">
        <div class="traffic-track">
          <div class="traffic-fill" :style="{ width: (Number(trafficInfo.pct) || 0) + '%', background: trafficInfo.color }"/>
        </div>
        <div class="traffic-text">
          <span>Net: {{ trafficInfo.display }}</span>
          <span>↑{{ formatSpeed(server.net_tx_speed) }} ↓{{ formatSpeed(server.net_rx_speed) }}</span>
        </div>
      </div>

      <div class="meta-info">
        <span>{{ server.os || 'Linux' }}</span>
        <span class="dot-sep">•</span>
        <span>Up: {{ formatUptime(server.uptime) }}</span>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ server: { type: Object, required: true } })
defineEmits(['show-detail'])

const online = computed(() =>
  props.server.last_active && (Date.now() / 1000) - props.server.last_active < 180
)

const getColor = (v) => {
  if (v > 90) return '#ef4444'
  if (v > 75) return '#f59e0b'
  return '#10b981'
}

const formatBytes = (b) => {
  if (!b || b === 0) return '0 B'
  const k = 1024, s = ['B','KB','MB','GB','TB'], i = Math.floor(Math.log(b) / Math.log(k))
  return parseFloat((b / k ** i).toFixed(2)) + ' ' + s[i]
}
const formatSpeed   = (b) => formatBytes(b) + '/s'
const formatUptime  = (s) => {
  if (!s) return '0s'
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60)
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`
}
const calculateDaysLeft = (dateStr) => {
  if (!dateStr) return ''
  const diff = new Date(dateStr) - new Date()
  if (diff < 0) return '已过期'
  const days = Math.ceil(diff / 86400000)
  return `${days} day${days > 1 ? 's' : ''}`
}
const getFlagEmoji = (code) => {
  if (!code || code === 'UN' || code === '-') return '🌐'
  try { return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0))) }
  catch { return '🌐' }
}

const gauges = computed(() => {
  const s = props.server || {}
  return [
    {
      label: 'CPU', pct: Math.min(s.cpu || 0, 100),
      display: (s.cpu || 0).toFixed(1) + '%',
      color: getColor(s.cpu || 0),
    },
    {
      label: 'RAM', pct: Math.min(s.mem || 0, 100),
      display: (s.mem || 0).toFixed(1) + '%',
      color: getColor(s.mem || 0),
    },
    {
      label: 'Disk', pct: Math.min(s.disk || 0, 100),
      display: (s.disk || 0).toFixed(1) + '%',
      color: getColor(s.disk || 0),
    },
    {
      label: 'Swap', pct: (() => {
        if (!s.swap_total || s.swap_total === 0) return 0
        return Math.min(((s.swap_used || 0) / s.swap_total) * 100, 100)
      })(),
      display: (() => {
        if (!s.swap_total || s.swap_total === 0) return 'N/A'
        return (((s.swap_used || 0) / s.swap_total) * 100).toFixed(1) + '%'
      })(),
      color: getColor(s.swap_total ? ((s.swap_used || 0) / s.swap_total) * 100 : 0),
    },
  ]
})

const trafficInfo = computed(() => {
  const s = props.server || {}
  if (!s.monthly_bw || s.monthly_bw <= 0) return null
  const used  = (s.net_tx_total || 0) + (s.net_rx_total || 0)
  const total = s.monthly_bw * 1024 ** 3
  const pct   = Math.min((used / total) * 100, 100)
  return {
    pct: parseFloat(pct.toFixed(1)) || 0,
    display: pct.toFixed(1) + '%',
    color: getColor(pct),
  }
})
</script>

<style scoped>
.dash-card {
  cursor: pointer;
  background: var(--surface-color, #fff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 20px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  transition: all 0.2s ease;
  position: relative;
}

.dash-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.08);
}

.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.name-group {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main, #1e293b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
}
.status-indicator.offline {
  background: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
}
.tag-expiry {
  font-size: 11px;
  color: var(--text-muted, #94a3b8);
  background: var(--bg-color, #f1f5f9);
  padding: 2px 6px;
  border-radius: 4px;
}

.main-gauges {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.gauge-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.ring-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
}
.gauge-svg {
  transform: rotate(-90deg);
}
.ring-bg {
  stroke: var(--border-color, #f1f5f9);
}
.ring-fill {
  transition: stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
.ring-content {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pct-num {
  font-size: 14px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.pct-num small {
  font-size: 10px;
  opacity: 0.7;
  margin-left: 1px;
}
.gauge-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dash-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.traffic-mini {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.traffic-track {
  height: 4px;
  background: var(--border-color, #f1f5f9);
  border-radius: 2px;
  overflow: hidden;
}
.traffic-fill {
  height: 100%;
  transition: width 1s ease;
}
.traffic-text {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--text-muted, #94a3b8);
  font-weight: 500;
}
.meta-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 10px;
  color: var(--text-muted, #94a3b8);
  opacity: 0.8;
}
.dot-sep {
  opacity: 0.4;
}
</style>