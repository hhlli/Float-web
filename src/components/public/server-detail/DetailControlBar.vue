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
          <span v-if="server" :class="['status-badge', online ? 'online' : 'offline']">
            <span class="status-dot"/>
            {{ online ? '在线' : '离线' }}
          </span>
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

    <div :class="['bar-row', 'bar-row--sub', { visible: activeTab === 'charts' }]">
      <div class="bar-left">
        <SlidingTabs 
          size="small"
          :modelValue="activeRange"
          @update:modelValue="$emit('update:activeRange', $event)"
          :options="timeRangeOptions" 
        />
      </div>

      <div class="bar-right">
        <SlidingTabs 
          size="small"
          :modelValue="chartType"
          @update:modelValue="$emit('update:chartType', $event)"
          :options="chartTypeOptions" 
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { loadTimeRanges, latencyTimeRanges } from './chartUtils.js'
import SlidingTabs from '../../common/SlidingTabs.vue'

const props = defineProps({
  server:      Object,
  online:      Boolean,
  activeTab:   String,
  chartType:   String,
  activeRange: String,
})

defineEmits(['back', 'update:activeTab', 'update:chartType', 'update:activeRange'])

// 定义 Tab 数据选项
const mainTabOptions = [
  { label: '详情概览', value: 'overview' },
  { label: '性能图表', value: 'charts' }
]

const chartTypeOptions = [
  { label: '负载', value: 'load' },
  { label: '延迟', value: 'network' }
]

// 适配 chartUtils 中定义的时间范围格式转换为 options 格式
const timeRangeOptions = computed(() => {
  const ranges = props.chartType === 'load' ? loadTimeRanges : latencyTimeRanges
  return ranges.map(t => ({ label: t.label, value: t.key }))
})
</script>

<style scoped>
.control-bar {
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  background: var(--surface-color, #fff);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.bar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 56px;
}

.bar-row--sub {
  height: 0;
  padding-top: 0;
  padding-bottom: 0;
  overflow: hidden;
  opacity: 0;
  border-top: 0px solid var(--border-color, #e2e8f0);
  transition: height 0.22s ease, opacity 0.22s ease, border-top-width 0.22s ease;
}
.bar-row--sub.visible {
  height: 48px;
  opacity: 1;
  border-top: 1px solid var(--border-color, #e2e8f0);
}

.bar-left, .bar-right { display: flex; align-items: center; gap: 12px; }

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid var(--border-color, #e2e8f0);
  padding: 0 14px;
  height: 34px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main, #1e293b);
  transition: background 0.15s;
}
.back-btn:hover { background: #f1f5f9; }
.back-btn svg { width: 16px; height: 16px; flex-shrink: 0; }

.v-divider { width: 1px; height: 22px; background: var(--border-color, #e2e8f0); }

.server-title { display: flex; align-items: center; gap: 8px; }
.server-icon  { width: 18px; height: 18px; color: #94a3b8; }
.name-text    { margin: 0; font-size: 17px; font-weight: 600; color: var(--text-main, #1e293b); }

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px 3px 8px;
  border-radius: 20px;
  font-size: 12px;
  background: rgba(22, 163, 74, 0.1);
  color: #16a34a;
}
.status-badge.offline { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

@media (max-width: 768px) {
  .bar-row { padding: 0 16px; flex-wrap: wrap; height: auto; min-height: 52px; gap: 8px; padding-top: 8px; padding-bottom: 8px; }
  .bar-row--sub.visible { height: auto; }
  .name-text { font-size: 15px; }
}
</style>