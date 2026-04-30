<template>
  <div class="sliding-tabs-container" :class="[`size-${size}`]" ref="containerRef">
    <div class="sliding-bg" :style="sliderStyle"></div>

    <button
      v-for="option in options"
      :key="option.value"
      :class="['tab-btn', { active: modelValue === option.value }]"
      @click="selectTab(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    required: true
  },
  options: {
    type: Array,
    required: true
  },
  size: {
    type: String,
    default: 'default'
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const containerRef = ref(null)
const sliderStyle = ref({
  transform: 'translateX(0px)',
  width: '0px',
  opacity: 0
})

const updateSlider = () => {
  if (!containerRef.value) return
  
  // 直接查询带有 active 类的按钮，绝对保证位置和宽度精准映射
  const activeTab = containerRef.value.querySelector('.tab-btn.active')
  if (!activeTab) return

  sliderStyle.value = {
    transform: `translateX(${activeTab.offsetLeft}px)`,
    width: `${activeTab.offsetWidth}px`,
    opacity: 1
  }
}

const selectTab = (value) => {
  if (props.modelValue !== value) {
    emit('update:modelValue', value)
    emit('change', value)
  }
}

watch(() => props.modelValue, async () => {
  // 等待 Vue 将 active class 赋予新的按钮后再计算位置
  await nextTick()
  updateSlider()
})

onMounted(async () => {
  await nextTick()
  // 增加微小延时，确保字体加载完毕后宽度计算完全准确
  setTimeout(() => {
    updateSlider()
  }, 50)
  window.addEventListener('resize', updateSlider)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateSlider)
})
</script>

<style scoped>
.sliding-tabs-container {
  position: relative;
  display: inline-flex;
  background: var(--surface-hover, #f1f5f9);
  padding: 3px;
  border-radius: 8px;
  gap: 2px;
}

.sliding-tabs-container.size-small {
  background: #eef0f3;
}

/* 滑动块底座 */
.sliding-bg {
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 0;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.07);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s;
  pointer-events: none; /* 核心：禁止滑块拦截点击事件 */
  z-index: 1;
}

/* 按钮本身 */
.tab-btn {
  position: relative;
  z-index: 2; /* 核心：确保按钮层级高于滑块，保证 100% 响应点击 */
  padding: 5px 14px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: color 0.25s;
  white-space: nowrap;
}

.size-small .tab-btn {
  padding: 5px 11px;
}

.tab-btn.active {
  color: #3b82f6;
}
.size-small .tab-btn.active {
  color: #1e293b;
}
</style>