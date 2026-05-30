<template>
  <div class="detail-content">
    <div class="detail-ip">{{ server.ipv4 || 'N/A' }}</div>
    
    <div class="metric-row">
      <span class="metric-label">CPU</span>
      <div class="metric-bar-wrap">
        <div class="metric-bar" :style="{ width: server.cpu?.toFixed(1) + '%' }" :class="getBarClass(server.cpu)"></div>
      </div>
      <span class="metric-value">{{ server.cpu?.toFixed(1) }}%</span>
    </div>

    <div class="metric-row">
      <span class="metric-label">MEM</span>
      <div class="metric-bar-wrap">
        <div class="metric-bar" :style="{ width: server.mem?.toFixed(1) + '%' }" :class="getBarClass(server.mem)"></div>
      </div>
      <span class="metric-value">{{ server.mem?.toFixed(1) }}%</span>
    </div>

    <div class="info-grid">
      <div class="info-item">
        <span class="info-key">UPTIME</span>
        <span class="info-val">{{ formatUptime(server.uptime) }}</span>
      </div>
      <div class="info-item">
        <span class="info-key">LAT / LON</span>
        <span class="info-val">{{ server.latitude?.toFixed(2) }}/{{ server.longitude?.toFixed(2) }}</span>
      </div>
      <div class="info-item">
        <span class="info-key">LAST SEEN</span>
        <span class="info-val">{{ formatLastActive(server.last_active) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  server: { type: Object, required: true }
})

const getBarClass = (val) => {
  if (val > 85) return 'bar-danger'
  if (val > 60) return 'bar-warn'
  return 'bar-ok'
}

const formatUptime = (seconds) => {
  if (!seconds) return 'N/A'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  if (d > 0) return `${d}d ${h}h`
  return `${h}h ${Math.floor((seconds % 3600) / 60)}m`
}

const formatLastActive = (ts) => {
  if (!ts) return 'N/A'
  const diff = Math.floor(Date.now() / 1000 - ts)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}
</script>

<style scoped>
.detail-content {
  padding: 0 12px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 1px dashed #00ff8822;
  margin-top: 4px;
  padding-top: 12px;
}

.detail-ip { font-family: 'Courier New', monospace; font-size: 11px; color: #2a5a40; letter-spacing: 0.08em; }

.metric-row { display: flex; align-items: center; gap: 10px; }
.metric-label { font-family: 'Courier New', monospace; font-size: 10px; color: #2a5a40; width: 24px; flex-shrink: 0; }
.metric-bar-wrap { flex: 1; height: 3px; background: #0a2a18; border-radius: 2px; overflow: hidden; }
.metric-bar { height: 100%; border-radius: 2px; transition: width 0.6s ease; }
.bar-ok { background: #00ff88; box-shadow: 0 0 4px #00ff8866; }
.bar-warn { background: #f59e0b; box-shadow: 0 0 4px #f59e0b66; }
.bar-danger { background: #ff4455; box-shadow: 0 0 4px #ff445566; }
.metric-value { font-family: 'Courier New', monospace; font-size: 11px; color: #00aa55; width: 34px; text-align: right; flex-shrink: 0; }

.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px; }
.info-item { display: flex; flex-direction: column; gap: 4px; }
.info-key { font-family: 'Courier New', monospace; font-size: 9px; color: #1a4a2a; letter-spacing: 0.1em; }
.info-val { font-family: 'Courier New', monospace; font-size: 10px; color: #2a7a45; }
</style>