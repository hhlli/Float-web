<template>
  <div class="tab-overview-container">
    
    <div class="status-ribbon">
      <div class="status-item">
        <span class="label">版本</span>
        <span class="value">{{ server?.agent_version || '1.1.93' }}</span>
      </div>
      <div class="status-item">
        <span class="label">运行时间</span>
        <span class="value">{{ formatUptime(server?.uptime) }}</span>
      </div>
      <div class="status-item">
        <span class="label">最后上报</span>
        <span class="value">{{ formatLastActive(server?.last_active) }}</span>
      </div>
    </div>

    <div class="info-grid">
      
      <div class="info-card resource-card">
        <h3>资源使用情况</h3>
        <div class="metric-list">
          <div class="metric-row">
            <div class="metric-header">
              <span>CPU</span>
              <span class="val">{{ (server?.cpu || 0).toFixed(1) }}%</span>
            </div>
            <div class="progress-bar"><div class="fill" :style="{ width: (server?.cpu || 0) + '%', background: getProgressColor(server?.cpu) }"></div></div>
          </div>

          <div class="metric-row">
            <div class="metric-header">
              <span>内存</span>
              <span class="val">{{ formatBytes(server?.mem_used) }} / {{ formatBytes(server?.mem_total) }}</span>
            </div>
            <div class="progress-bar"><div class="fill" :style="{ width: getPercent(server?.mem_used, server?.mem_total) + '%', background: 'var(--primary-color)' }"></div></div>
          </div>

          <div class="metric-row">
            <div class="metric-header">
              <span>磁盘</span>
              <span class="val">{{ formatBytes(server?.disk_used) }} / {{ formatBytes(server?.disk_total) }}</span>
            </div>
            <div class="progress-bar"><div class="fill" :style="{ width: getPercent(server?.disk_used, server?.disk_total) + '%', background: 'var(--primary-color)' }"></div></div>
          </div>
          
          <div class="metric-row">
            <div class="metric-header">
              <span>交换区 (Swap)</span>
              <span class="val">{{ formatBytes(server?.swap_used) }} / {{ formatBytes(server?.swap_total) }}</span>
            </div>
            <div class="progress-bar"><div class="fill" :style="{ width: getPercent(server?.swap_used, server?.swap_total) + '%', background: '#d1d5db' }"></div></div>
          </div>

          <div class="metric-row mt-4">
            <div class="metric-header" style="color: var(--text-muted); font-size: 13px;">
              <span>流量限制</span>
              <span class="badge-max" v-if="!server?.monthly_bw">MAX</span>
            </div>
            <div class="progress-bar mt-1"><div class="fill" :style="{ width: getTrafficPercent(server) + '%', background: '#d1d5db' }"></div></div>
            <div class="metric-footer">
              <span>{{ formatBytes((server?.net_tx_total || 0) + (server?.net_rx_total || 0)) }}</span>
              <span v-if="server?.monthly_bw">{{ server.monthly_bw }} GB</span>
              <span v-else>无限制</span>
              <span>{{ getTrafficPercent(server) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="info-card text-card">
        <h3>系统信息</h3>
        <div class="text-group">
          <label>操作系统</label>
          <div class="value">{{ server?.os || 'Unknown OS' }}</div>
        </div>
        <div class="text-group">
          <label>内核版本</label>
          <div class="value">{{ server?.kernel || 'Unknown' }}</div>
        </div>
        <div class="text-group">
          <label>架构</label>
          <div class="value">{{ server?.arch || 'amd64' }}</div>
        </div>
        <div class="text-group">
          <label>虚拟化</label>
          <div class="value">{{ server?.virt || 'kvm' }}</div>
        </div>
      </div>

      <div class="info-card text-card">
        <h3>硬件信息</h3>
        <div class="text-group">
          <label>CPU</label>
          <div class="value">{{ server?.cpu_model || 'Unknown Processor' }}</div>
        </div>
        <div class="text-group">
          <label>GPU</label>
          <div class="value">{{ server?.gpu_model || 'None' }}</div>
        </div>
        <div class="text-group">
          <label>内存</label>
          <div class="value">{{ formatBytes(server?.mem_total) }}</div>
        </div>
        <div class="text-group">
          <label>磁盘</label>
          <div class="value">{{ formatBytes(server?.disk_total) }}</div>
        </div>
      </div>

      <div class="info-card text-card">
        <h3>网络信息</h3>
        <div class="text-group">
          <label>网络</label>
          <div class="value speed-val">↑ {{ formatSpeed(server?.net_tx_speed) }}<br>↓ {{ formatSpeed(server?.net_rx_speed) }}</div>
        </div>
        <div class="text-group">
          <label>总流量</label>
          <div class="value speed-val">↑ {{ formatBytes(server?.net_tx_total) }}<br>↓ {{ formatBytes(server?.net_rx_total) }}</div>
        </div>
        <div class="text-group">
          <label>连接数</label>
          <div class="value">TCP: {{ server?.tcp_conn || 0 }}, UDP: {{ server?.udp_conn || 0 }}</div>
        </div>
      </div>

      <div class="info-card text-card">
        <h3>运行时信息</h3>
        <div class="text-group">
          <label>运行时间</label>
          <div class="value">{{ formatUptime(server?.uptime) }}</div>
        </div>
        <div class="text-group">
          <label>进程</label>
          <div class="value">{{ server?.processes || 0 }}</div>
        </div>
        <div class="text-group">
          <label>负载</label>
          <div class="value load-val">
            1m: {{ (server?.load_1 || 0).toFixed(2) }}<br>
            5m: {{ (server?.load_5 || 0).toFixed(2) }}<br>
            15m: {{ (server?.load_15 || 0).toFixed(2) }}
          </div>
        </div>
      </div>

      <div class="info-card delay-card">
        <h3>延迟</h3>
        <table class="delay-table">
          <thead>
            <tr>
              <th style="text-align: left;">任务名</th>
              <th>当前</th>
              <th>平均</th>
              <th>丢包</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 20px;">后端数据待接入</td></tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  server: Object
})

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatSpeed = (bytes) => formatBytes(bytes) + '/s'

const getPercent = (used, total) => {
  if (!total || total === 0) return 0
  const p = (used / total) * 100
  return p > 100 ? 100 : p
}

const getTrafficPercent = (s) => {
  if (!s || !s.monthly_bw || s.monthly_bw <= 0) return 0
  const used = (s.net_tx_total || 0) + (s.net_rx_total || 0)
  const total = s.monthly_bw * 1024 * 1024 * 1024
  const p = (used / total) * 100
  return p > 100 ? 100 : p.toFixed(1)
}

const getProgressColor = (percent) => {
  const p = percent || 0
  if (p > 90) return '#ef4444' 
  if (p > 75) return '#f59e0b' 
  return 'var(--primary-color)' 
}

const formatUptime = (seconds) => {
  if (!seconds) return '0s'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (d > 0) return `${d} 天 ${h} 时 ${m} 分 ${s} 秒`
  return `${h} 时 ${m} 分 ${s} 秒`
}

const formatLastActive = (ts) => {
  if (!ts) return '-'
  const d = new Date(ts * 1000)
  return d.toLocaleString()
}
</script>

<style scoped>
.tab-overview-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0;
}

/* 顶部状态条 */
.status-ribbon {
  display: flex;
  gap: 16px;
}
.status-item {
  flex: 1;
  background: var(--surface-color, #fff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.status-item .label {
  font-size: 13px;
  color: var(--text-muted);
}
.status-item .value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

/* 网格布局 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.info-card {
  background: var(--surface-color, #fff);
  border: 1px solid var(--border-color, #e2e8f0);
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

/* 跨列设置 */
.resource-card { grid-column: span 1; }
.text-card { grid-column: span 1; }
.delay-card { grid-column: span 3; } /* 延迟表格占得比较宽 */

@media (max-width: 1200px) {
  .info-grid { grid-template-columns: repeat(2, 1fr); }
  .resource-card, .text-card { grid-column: span 1; }
  .delay-card { grid-column: span 2; }
}

@media (max-width: 768px) {
  .info-grid { grid-template-columns: 1fr; }
  .resource-card, .text-card, .delay-card { grid-column: span 1; }
  .status-ribbon { flex-direction: column; }
}

/* 资源进度条模块 */
.metric-list { display: flex; flex-direction: column; gap: 16px; }
.metric-row { display: flex; flex-direction: column; gap: 6px; }
.metric-header { display: flex; justify-content: space-between; font-size: 14px; color: var(--text-main); }
.metric-header .val { font-weight: 600; }
.progress-bar { height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden; }
.progress-bar .fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
.mt-4 { margin-top: 16px; }
.mt-1 { margin-top: 4px; }
.badge-max { background: var(--border-color); padding: 2px 8px; border-radius: 12px; font-size: 11px; }
.metric-footer { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-top: 4px; }

/* 文本模块 */
.text-group { margin-bottom: 16px; }
.text-group:last-child { margin-bottom: 0; }
.text-group label { display: block; font-size: 13px; color: var(--text-muted); margin-bottom: 4px; }
.text-group .value { font-size: 15px; font-weight: 600; color: var(--text-main); }
.speed-val { line-height: 1.5; }
.load-val { line-height: 1.5; font-weight: 500; font-family: monospace; }

/* 延迟表格 */
.delay-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.delay-table th { color: var(--text-main); font-weight: 500; padding-bottom: 12px; border-bottom: 1px solid var(--border-color); }
.delay-table td { padding: 12px 0; color: var(--text-muted); text-align: center; }
.delay-table td:first-child { text-align: left; color: var(--text-main); font-weight: 500; }
</style>