<template>
  <div class="server-card compact" @click="$emit('show-detail', server)">
    
    <div class="card-header-layout">
      <div class="title-group">
        <span class="flag-icon">{{ getFlagEmoji(server.region) }}</span>
        <span class="server-name">{{ server.name }}</span>
      </div>
      <StatusDot :isOnline="isOnline(server.last_active)" />
    </div>

    <div class="compact-stats">
      <span>UP: {{ formatUptime(server.uptime) }}</span>
      <span>↑{{ formatSpeed(server.net_tx_speed) }} ↓{{ formatSpeed(server.net_rx_speed) }}</span>
    </div>

    <div class="heatmap-container">
      <div class="heatmap-meta">
        <span class="label">30天可用性</span>
        <span class="sla-value">{{ server.sla }}%</span>
      </div>
      
      <div class="heatmap-grid">
        <div 
          v-for="(day, index) in heatmapData" 
          :key="index"
          class="heatmap-block"
          :class="day.status"
          :title="`${day.date} : ${day.label}`"
        ></div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { isOnline, getFlagEmoji, formatUptime, formatSpeed } from '@/utils/format.js'
import StatusDot from '@/components/common/StatusDot.vue'

const props = defineProps({
  server: { type: Object, required: true }
})

defineEmits(['show-detail'])

const heatmapData = computed(() => {
  if (props.server.history && props.server.history.length > 0) {
    return props.server.history
  }
  return [] // 后端已实现，此处不写 Mock
})
</script>

<style scoped>
.server-card.compact {
  cursor: pointer;
  background: var(--surface-color);
  border-radius: var(--radius-lg);
  padding: 12px 16px; /* 🌟 减小内边距 */
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 8px; /* 固定元素间距 */
}

.server-card.compact:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
  /* 移除了 border-color 属性，避免出现蓝色边框 */
}

.card-header-layout {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.flag-icon { font-size: 16px; }
.server-name { 
  font-size: 16px;      /* 从 15px 改为 16px */
  font-weight: 700;     /* 从 600 改为 700 */
  color: var(--text-main); 
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.compact-stats {
  display: flex;
  justify-content: space-between;
  font-size: 10px;      /* 从 11px 改为 10px */
  font-weight: 500;     /* 新增 500 字重 */
  color: var(--text-muted);
  /* 已移除 font-family: ui-monospace, monospace; */
}

.heatmap-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.heatmap-meta {
  display: flex;
  justify-content: space-between;
  font-size: 10px;      /* 从 11px 改为 10px */
  font-weight: 500;
}

.heatmap-meta .label { color: var(--text-muted); }
.heatmap-meta .sla-value { color: #10b981; }

.heatmap-grid {
  display: flex;
  gap: 2px;
  width: 100%;
  height: 12px; /* 🌟 极大的高度压缩 */
}

.heatmap-block {
  flex: 1;
  border-radius: 10px; /* 增大此值，10px 足以让小色块两端完全变圆 */ 
  background-color: var(--border-color);
  opacity: 0.3;
}
.heatmap-block.online { background-color: #10b981; opacity: 1; }
.heatmap-block.offline { background-color: #ef4444; opacity: 1; }
.heatmap-block.nodata { background-color: var(--border-color); opacity: 0.2; }

</style>