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
        </button>

        <div class="v-divider"/>

        <div class="server-title">
          <span class="flag-icon" :title="server?.region">{{ getFlagEmoji(server?.region) }}</span>
          <h2 class="name-text">{{ server?.name || '加载中...' }}</h2>
          <StatusBadge v-if="server" :online="online" />
        </div>
      </div>

      <div class="bar-right">

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
import { getFlagEmoji } from '@/utils/format.js'

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
  min-height: 56px;
  flex-wrap: wrap; /* 允许在极端情况下自然换行 */
  gap: 12px;
}

.bar-left, .bar-right { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
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

.flag-icon {
  font-size: 18px;
  line-height: 1;
  border-radius: 2px;
  overflow: visible; 
  display: inline-block;
}

.name-text { 
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
    gap: 4px; /* 重点：控制你圈出位置被挤压到极限时的最小间距，4px 够紧凑了 */
  }
  .name-text { 
    font-size: 15px; 
  }
  .bar-right {
    width: auto; /* 重点：去掉原来的 100% 宽度，让它允许呆在第一行 */
  }
}
</style>