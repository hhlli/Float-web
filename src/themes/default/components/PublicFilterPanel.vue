<template>
  <div class="filter-wrapper" ref="filterRef">
    <button class="icon-btn" :class="{ active: showFilter }" @click="showFilter = !showFilter" title="筛选与视图">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
      </svg>
      <span v-if="hasActiveFilter" class="status-indicator"></span>
    </button>

    <transition name="dropdown">
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
          <span class="panel-label">视图分组</span>
          <BaseSelect 
            :modelValue="groupBy"
            @update:modelValue="$emit('update:groupBy', $event)"
            :options="groupOptions" 
          />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import BaseSelect from '@/components/common/BaseSelect.vue'

const props = defineProps({
  filterBy: String,
  groupBy:  String
})

defineEmits(['update:filterBy', 'update:groupBy'])

const filterOptions = [
  { label: '全部状态', value: 'all' },
  { label: '仅在线', value: 'online' },
  { label: '仅离线', value: 'offline' }
]

const groupOptions = [
  { label: '不分组', value: 'none' },
  { label: '按区域', value: 'region' }
]

const showFilter = ref(false)
const filterRef = ref(null)

const hasActiveFilter = computed(() => {
  return props.filterBy !== 'all' || props.groupBy !== 'none'
})

const handleClickOutside = (e) => {
  if (filterRef.value && !filterRef.value.contains(e.target)) {
    showFilter.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.filter-wrapper {
  position: relative;
}

.icon-btn {
  position: relative;
  background: transparent;
  border: 1px solid transparent;
  padding: 6px;
  border-radius: 6px;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}

.icon-btn:hover, .icon-btn.active {
  background: var(--bg-color);
  color: var(--text-main);
}

.icon-btn svg {
  width: 16px;
  height: 16px;
}

.status-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  background-color: var(--primary-color, #3b82f6);
  border-radius: 50%;
  border: 1.5px solid var(--surface-color);
}

.filter-panel {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  padding: 16px;
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 100;
}

.panel-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.panel-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
}

.dropdown-enter-active, .dropdown-leave-active { 
  transition: opacity 0.15s ease, transform 0.15s ease; 
}
.dropdown-enter-from, .dropdown-leave-to { 
  opacity: 0; 
  transform: translateY(-6px); 
}
</style>