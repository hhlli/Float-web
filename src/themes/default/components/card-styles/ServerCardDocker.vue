<template>
  <div class="server-card compact" v-if="dockerContainers.length > 0" @click="$emit('show-detail', server)">
    
    <div class="card-header-layout">
      <div class="title-group">
        <span class="flag-icon">{{ getFlagEmoji(server.region) }}</span>
        <span class="server-name">{{ server.name }}</span>
      </div>
      <StatusDot :isOnline="isOnline(server.last_active)" />
    </div>

    <div class="compact-stats">
      <span>UP: {{ formatUptime(server.uptime) }}</span>
      <span>运行容器: {{ dockerContainers.length }}</span>
    </div>

    <div class="docker-container-list">
      <div 
        v-for="container in dockerContainers" 
        :key="container.id" 
        class="docker-item-compact"
      >
        <div class="item-left">
          <span class="c-name" :title="container.name">{{ container.name }}</span>
          <span class="c-metrics" v-if="container.cpu !== undefined">
            C: {{ container.cpu.toFixed(1) }}% | M: {{ container.mem_pct ? container.mem_pct.toFixed(1) : 0 }}%
          </span>
        </div>
        <span :class="['state-pill', container.state]">{{ container.state }}</span>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { isOnline, getFlagEmoji, formatUptime } from '@/utils/format.js'
import StatusDot from '@/components/common/StatusDot.vue'

const props = defineProps({
  server: { type: Object, required: true }
})

defineEmits(['show-detail'])

const dockerContainers = computed(() => {
  if (typeof props.server.docker_containers === 'string') {
    try {
      return JSON.parse(props.server.docker_containers)
    } catch {
      return []
    }
  }
  return props.server.docker_containers || []
})
</script>

<style scoped>
.server-card.compact {
  cursor: pointer;
  background: var(--surface-color);
  border-radius: var(--radius-lg);
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.server-card.compact:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
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
  font-size: 16px; 
  font-weight: 700; 
  color: var(--text-main); 
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.compact-stats {
  display: flex;
  justify-content: space-between;
  font-size: 10px; 
  font-weight: 500; 
  color: var(--text-muted);
}

/* 紧凑型 Docker 列表样式 */
.docker-container-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.docker-item-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: var(--bg-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

/* 左侧信息容器 */
.item-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  flex: 1;
}

.c-name {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

/* 指标文本样式 */
.c-metrics {
  font-size: 9px;
  color: var(--text-muted);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
}

.state-pill {
  font-size: 9px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

/* 状态颜色映射 */
.state-pill.running {
  background-color: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.state-pill.exited,
.state-pill.dead {
  background-color: rgba(107, 114, 128, 0.15);
  color: #6b7280;
}

.state-pill.paused {
  background-color: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.state-pill.restarting,
.state-pill.created {
  background-color: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}
</style>