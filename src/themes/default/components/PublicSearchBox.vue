<template>
  <div class="search-wrapper" :class="{ 'is-active': showSearch || modelValue }">
    <div class="icon-box" @mousedown.prevent="handleIconClick" title="搜索节点">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    </div>
    
    <input 
      ref="searchInput"
      type="text" 
      placeholder="搜索名称或区域..." 
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      @blur="handleSearchBlur"
    />
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const showSearch = ref(false)
const searchInput = ref(null)

// 核心修改：增加状态判断逻辑，实现正确的展开与收回切换
const handleIconClick = () => {
  if (showSearch.value) {
    // 处于激活状态且没有输入内容时，点击放大镜收回
    if (!props.modelValue) {
      showSearch.value = false
      searchInput.value?.blur()
    }
  } else {
    // 处于未激活状态时，展开并聚焦
    showSearch.value = true
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
}

const handleSearchBlur = () => {
  if (!props.modelValue) {
    showSearch.value = false
  }
}
</script>

<style scoped>
.search-wrapper {
  display: flex;
  align-items: center;
  background: transparent;
  height: 32px;
  box-sizing: border-box;
}

.icon-box {
  width: 30px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  flex-shrink: 0;
  border-radius: 6px;
  transition: color 0.3s ease, background-color 0.3s ease;
}

/* 未激活时保持悬浮背景反馈 */
.search-wrapper:not(.is-active) .icon-box:hover {
  background: var(--bg-color, rgba(0,0,0,0.05));
  color: var(--text-main);
}

/* 激活态：去除指针交互暗示 */
.search-wrapper.is-active .icon-box {
  cursor: default;
  color: var(--text-main);
}

/* 暴力重置 input 原生样式，消除内部灰色底框与外发光 */
input {
  width: 0;
  padding: 0;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  background: transparent !important;
  -webkit-appearance: none;
  appearance: none;
  font-size: 13px;
  color: var(--text-main);
  transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1), padding 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

input:focus {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

.search-wrapper.is-active input {
  width: 150px;
  padding-left: 6px;
  padding-right: 12px; 
}
.icon-box svg {
  width: 16px;
  height: 16px;
}
</style>