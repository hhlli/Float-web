<template>
  <div class="toolbar-bar">
    
    <div class="toolbar-stats">
      <div class="stat-cell">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="stat-icon">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span class="stat-value">{{ currentTime }}</span>
      </div>

      <div class="divider-v"></div>

      <div class="stat-cell">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="stat-icon">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
          <line x1="6" y1="6" x2="6.01" y2="6"></line>
          <line x1="6" y1="18" x2="6.01" y2="18"></line>
        </svg>
        <div class="server-progress-wrapper" title="在线节点 / 总节点">
          <svg class="ring-chart" viewBox="0 0 36 36">
            <circle class="ring-bg" cx="18" cy="18" r="15.9155" />
            <circle class="ring-value" cx="18" cy="18" r="15.9155" :stroke-dasharray="`${onlinePercent}, 100`" />
          </svg>
          <span class="progress-text">{{ onlineCount }} / {{ serverCount }}</span>
        </div>
      </div>

      <div class="divider-v"></div>

      <div class="stat-cell">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="stat-icon">
          <path d="M21.54 15H17a2 2 0 0 0-2 2v4.54"></path>
          <path d="M7 3.34V5a3 3 0 0 0 3 3v0a2 2 0 0 1 2 2v0c0 1.1.9 2 2 2v0a2 2 0 0 0 2-2v0c0-1.1.9-2 2-2h1.03"></path>
          <path d="M11 7.3A6.2 6.2 0 0 0 3 15h11.5"></path>
          <path d="M12 17.5V14"></path>
        </svg>
        <span class="stat-value">↑ {{ totalTrafficTx }} | ↓ {{ totalTrafficRx }}</span>
      </div>

      <div class="divider-v"></div>

      <div class="stat-cell">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="stat-icon">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
        <span class="stat-value">↑ {{ totalSpeedTx }} | ↓ {{ totalSpeedRx }}</span>
      </div>
    </div>

    <div class="toolbar-right">
      <PublicSearchBox 
        :modelValue="searchQuery"
        @update:modelValue="$emit('update:searchQuery', $event)"
      />

      <div class="filter-wrapper" ref="filterRef">
        <button class="icon-btn" :class="{ active: showFilter }" @click="showFilter = !showFilter" title="筛选与排序">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
        </button>

        <div v-if="showFilter" class="filter-panel">
          <div class="panel-item">
            <span class="panel-label">运行状态</span>
            <BaseSelect 
              :modelValue="filterBy"
              @update:modelValue="$emit('update:filterBy', $event)"
              :options="filterOptions" 
            />
          </div>
          <div class="panel-item">
            <span class="panel-label">节点排序</span>
            <BaseSelect 
              :modelValue="sortBy"
              @update:modelValue="$emit('update:sortBy', $event)"
              :options="sortOptions" 
            />
          </div>
          <div class="panel-item">
            <span class="panel-label">视图分组</span>
            <BaseSelect 
              :modelValue="groupBy"
              @update:modelValue="$emit('update:groupBy', $event)"
              :options="groupOptions" 
            />
          </div>
        </div>
      </div>

      <div class="divider-v"></div>

      <BaseSelect 
        :modelValue="cardStyle"
        @update:modelValue="$emit('update:cardStyle', $event)"
        :options="styleOptions" 
        style="width: 110px"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import PublicSearchBox from './PublicSearchBox.vue'

const props = defineProps({
  serverCount:    Number,
  onlineCount:    { type: Number, default: 0 },
  offlineCount:   { type: Number, default: 0 },
  totalTrafficTx: { type: String, default: '0 B' },
  totalTrafficRx: { type: String, default: '0 B' },
  totalSpeedTx:   { type: String, default: '0 B/s' },
  totalSpeedRx:   { type: String, default: '0 B/s' },
  searchQuery:    String,
  filterBy:       String,
  sortBy:         String,
  groupBy:        String,
  cardStyle:      String,
  styleOptions:   Array
})

defineEmits(['update:searchQuery', 'update:filterBy', 'update:sortBy', 'update:groupBy', 'update:cardStyle'])

const onlinePercent = computed(() => {
  if (!props.serverCount) return 0
  return (props.onlineCount / props.serverCount) * 100
})

const currentTime = ref('')
let timeInterval = null

const updateTime = () => {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  currentTime.value = `${hh}:${mm}:${ss}`
}

const filterOptions = [
  { label: '全部状态', value: 'all' },
  { label: '仅在线', value: 'online' },
  { label: '仅离线', value: 'offline' }
]

const sortOptions = [
  { label: '默认排序', value: 'default' },
  { label: 'CPU 负载', value: 'cpu' },
  { label: '网速降序', value: 'network' }
]

const groupOptions = [
  { label: '不分组', value: 'none' },
  { label: '按区域', value: 'region' }
]

const showFilter = ref(false)
const filterRef = ref(null)

const handleClickOutside = (e) => {
  if (filterRef.value && !filterRef.value.contains(e.target)) {
    showFilter.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (timeInterval) clearInterval(timeInterval)
})
</script>

<style scoped>
/* --- 全局外层布局 --- */
.toolbar-bar {
  max-width: 1440px; 
  width: 100%; 
  margin: 0 auto; 
  min-height: 52px;
  background: var(--surface-color); 
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm); 
  padding: 8px 20px; 
  box-sizing: border-box;
  
  display: flex;
  flex-wrap: wrap; /* 允许在屏幕极窄时，左右两大部分整体折行 */
  justify-content: space-between;
  align-items: center;
  gap: 12px 16px;
}

/* --- 左侧流式数据区 --- */
.toolbar-stats {
  display: flex;
  flex-wrap: wrap; /* 允许独立数据项在空间不足时依次折行 */
  align-items: center;
  gap: 12px 16px;
  flex: 1 1 auto;
  min-width: 0;
}

/* --- 右侧横向操作区 --- */
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0; /* 保证右侧功能区不被压缩变形 */
  margin-left: auto;
}

/* --- 局部模块基础样式 --- */
.stat-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  flex-shrink: 0;
}

.stat-icon {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.stat-value {
  font-size: 13px;
  color: var(--text-main);
  font-weight: 500;
  white-space: nowrap;
}

.divider-v { 
  width: 1px; 
  height: 16px; 
  background: var(--border-color); 
  flex-shrink: 0;
}

/* --- 圆环进度条 --- */
.server-progress-wrapper { display: flex; align-items: center; gap: 6px; }
.ring-chart { width: 20px; height: 20px; transform: rotate(-90deg); }
.ring-bg { fill: none; stroke: #ef4444; stroke-width: 5; }
.ring-value { fill: none; stroke: #10b981; stroke-width: 5; stroke-linecap: round; transition: stroke-dasharray 0.6s ease; }
.progress-text { font-size: 13px; font-weight: 600; color: var(--text-main); font-variant-numeric: tabular-nums; }

/* --- 工具图标按钮 --- */
.icon-btn { background: transparent; border: 1px solid transparent; padding: 6px; border-radius: 6px; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; transition: all 0.2s; }
.icon-btn:hover, .icon-btn.active { background: var(--bg-color); color: var(--text-main); }
.icon-btn svg { width: 16px; height: 16px; }

/* --- 筛选面板 --- */
.filter-wrapper { position: relative; }
.filter-panel { position: absolute; top: 100%; right: 0; margin-top: 8px; background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); padding: 16px; width: 200px; display: flex; flex-direction: column; gap: 16px; z-index: 100; }
.panel-item { display: flex; flex-direction: column; gap: 6px; }
.panel-label { font-size: 12px; color: var(--text-muted); font-weight: 600; }

/* --- 响应式处理 (隐藏竖线以避免折行时排版错位) --- */
@media (max-width: 900px) {
  .divider-v {
    display: none;
  }
}
</style>