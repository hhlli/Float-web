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

      <div class="stat-cell">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="stat-icon">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
          <line x1="6" y1="6" x2="6.01" y2="6"></line>
          <line x1="6" y1="18" x2="6.01" y2="18"></line>
        </svg>
        <span class="stat-value" title="在线节点 / 总节点">{{ onlineCount }} / {{ serverCount }}</span>
      </div>

      <div class="stat-cell metric-cell">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="stat-icon">
          <path d="M21.54 15H17a2 2 0 0 0-2 2v4.54"></path>
          <path d="M7 3.34V5a3 3 0 0 0 3 3v0a2 2 0 0 1 2 2v0c0 1.1.9 2 2 2v0a2 2 0 0 0 2-2v0c0-1.1.9-2 2-2h1.03"></path>
          <path d="M11 7.3A6.2 6.2 0 0 0 3 15h11.5"></path>
          <path d="M12 17.5V14"></path>
        </svg>
        <span class="stat-value">↑ {{ totalTrafficTx }} | ↓ {{ totalTrafficRx }}</span>
      </div>

      <div class="stat-cell metric-cell">
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

      <PublicFilterPanel
        :filterBy="filterBy"
        :groupBy="groupBy"
        @update:filterBy="$emit('update:filterBy', $event)"
        @update:groupBy="$emit('update:groupBy', $event)"
      />

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
import { ref, onMounted, onUnmounted } from 'vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import PublicSearchBox from './PublicSearchBox.vue'
import PublicFilterPanel from './PublicFilterPanel.vue'

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
  groupBy:        String,
  cardStyle:      String,
  styleOptions:   Array
})

defineEmits(['update:searchQuery', 'update:filterBy', 'update:groupBy', 'update:cardStyle'])

const currentTime = ref('')
let timeInterval = null

const updateTime = () => {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  currentTime.value = `${hh}:${mm}:${ss}`
}

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
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
  padding: 10px 20px; 
  box-sizing: border-box;
  
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

/* --- 左侧流式数据区 --- */
.toolbar-stats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  flex: 1 1 auto;
  min-width: 0;
}

/* --- 右侧横向操作区 --- */
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  margin-left: auto;
}

/* --- 局部模块基础样式 --- */
.stat-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
  
  height: 32px;
  padding: 0 10px;
  background-color: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-sizing: border-box;

  flex: 1 1 auto;
}

.metric-cell {
  flex: 1.2 1 auto; 
  justify-content: center;
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
  font-variant-numeric: tabular-nums;
  
  /* 核心修复：激活块级控制权，并锁死文本对齐方向 */
  display: inline-block;
  text-align: left;
}
/* 锁定短数据（时间、节点数）的绝对物理宽度 */
.stat-cell:not(.metric-cell) .stat-value {
  width: 65px; 
}

/* 锁定长数据（流量、网速）的绝对物理宽度 */
.metric-cell .stat-value {
  width: 185px; 
}

/* --- 分隔线 (仅保留右侧操作区所需) --- */
.divider-v { 
  width: 1px; 
  height: 16px; 
  background: var(--border-color); 
  flex-shrink: 0;
}

/* --- 移动端排版修正 --- */
@media (max-width: 900px) {
  .toolbar-bar {
    padding: 12px 16px;
  }
  
  .toolbar-right {
    width: 100%;
    margin-left: 0;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .divider-v {
    display: none;
  }
}
</style>