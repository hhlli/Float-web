<template>
  <div class="control-bar">
    <div class="bar-row bar-row--main">
      <div class="bar-left">
        <button class="back-btn" @click="$emit('back')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          返回
        </button>

        <div class="v-divider"/>

        <div class="server-title">
          <svg class="server-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
            <polyline points="6 8 10 12 6 16"/>
            <line x1="12" y1="16" x2="18" y2="16"/>
          </svg>
          <h2 class="name-text">{{ server?.name || '加载中...' }}</h2>
          <StatusBadge v-if="server" :online="online" />
        </div>
      </div>

      <div class="bar-right">
        <div class="header-heatmap" v-if="server && server.history_24h">
          <Heatmap24H 
            :history="server.history_24h" 
            :sla="server.sla_24h" 
          />
        </div>

        <SlidingTabs 
          :modelValue="activeTab"
          @update:modelValue="$emit('update:activeTab', $event)"
          :options="mainTabOptions" 
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import SlidingTabs from '@/components/common/SlidingTabs.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
// 引入热力图组件
import Heatmap24H from '@/components/common/Heatmap24H.vue'

const props = defineProps({
  server:      Object,
  online:      Boolean,
  activeTab:   String,
})

defineEmits(['back', 'update:activeTab'])

const mainTabOptions = [
  { label: '详情概览', value: 'overview' },
  { label: '性能图表', value: 'charts' }
]
</script>

<style scoped>
.control-bar {
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  background: var(--surface-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.bar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  min-height: 56px; /* 改为 min-height 以适应内容换行 */
}

.bar-left, .bar-right { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
}

.header-heatmap {
  width: 200px; /* 限制顶栏热力图宽度 */
  margin-right: 12px;
}

/* 覆盖 Heatmap24H 默认的 margin-top 使其在顶栏中垂直居中 */
:deep(.uptime-24h-wrapper) {
  margin-top: 0 !important;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid var(--border-color);
  padding: 0 14px;
  height: 34px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  transition: background 0.15s;
}
.back-btn:hover { 
  background: var(--bg-color); 
}
.back-btn svg { 
  width: 16px; 
  height: 16px; 
  flex-shrink: 0; 
}

.v-divider { 
  width: 1px; 
  height: 22px; 
  background: var(--border-color); 
}

.server-title { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
}
.server-icon  { 
  width: 18px; 
  height: 18px; 
  color: var(--text-muted); 
}
.name-text    { 
  margin: 0; 
  font-size: 17px; 
  font-weight: 600; 
  color: var(--text-main); 
}

@media (max-width: 768px) {
  .bar-row { 
    padding: 12px 16px; 
    flex-wrap: wrap; 
    height: auto; 
    gap: 12px; 
  }
  .name-text { 
    font-size: 15px; 
  }
  .bar-right {
    width: 100%;
    justify-content: space-between; /* 移动端两端对齐 */
  }
  .header-heatmap {
    width: 160px; /* 移动端适当缩小宽度 */
    margin-right: 0;
  }
}
</style>