<template>
  <div class="swipe-picker-container" :class="[`size-${size}`]">
    <div 
      class="swipe-track" 
      ref="trackRef"
      @scroll="handleScroll"
    >
      <div
        v-for="option in options"
        :key="option.value"
        :class="['picker-item', { active: modelValue === option.value }]"
        @click="selectTab(option.value)"
      >
        <span>{{ option.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], required: true },
  options: { type: Array, required: true },
  size: { type: String, default: 'default' }
})

const emit = defineEmits(['update:modelValue', 'change'])

const trackRef = ref(null)
let scrollTimeout = null
let isProgrammaticScroll = false

const handleScroll = (e) => {
  if (isProgrammaticScroll) return
  const container = e.target
  
  // 仅在存在横向滚动条（移动端滑动模式）时执行
  if (container.scrollWidth <= container.clientWidth) return

  clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    const itemWidth = container.clientWidth
    const index = Math.round(container.scrollLeft / itemWidth)
    
    if (props.options[index] && props.modelValue !== props.options[index].value) {
      emit('update:modelValue', props.options[index].value)
      emit('change', props.options[index].value)
    }
  }, 100)
}

const scrollToActive = () => {
  if (!trackRef.value) return
  const container = trackRef.value
  
  // 桌面端平铺模式不执行滚动定位
  if (container.scrollWidth <= container.clientWidth) return

  const index = props.options.findIndex(opt => opt.value === props.modelValue)
  if (index !== -1) {
    isProgrammaticScroll = true
    container.scrollTo({
      left: index * container.clientWidth,
      behavior: 'smooth'
    })
    setTimeout(() => { isProgrammaticScroll = false }, 350)
  }
}

const selectTab = (value) => {
  if (props.modelValue !== value) {
    emit('update:modelValue', value)
    emit('change', value)
  }
}

watch(() => props.modelValue, () => {
  nextTick(() => { scrollToActive() })
})

onMounted(() => {
  nextTick(() => { setTimeout(scrollToActive, 50) })
})
</script>

<style scoped>
/* 桌面端：恢复平铺展示，允许直接点击 */
.swipe-picker-container {
  display: inline-flex;
  background: var(--bg-color);
  padding: 3px;
  border-radius: 8px;
}

.swipe-picker-container.size-small {
  background: var(--border-color);
}

.swipe-track {
  display: flex;
  gap: 2px;
}

.picker-item {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.picker-item span {
  padding: 5px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  transition: all 0.25s;
  white-space: nowrap;
}

.size-small .picker-item span {
  padding: 4px 11px;
}

.picker-item.active span {
  color: var(--primary-color);
  background: var(--surface-color);
  box-shadow: 0 1px 3px rgba(0,0,0,0.07);
}

.size-small .picker-item.active span {
  color: var(--text-main);
}

/* 移动端：启用单项滑动模式 */
@media (max-width: 768px) {
  .swipe-picker-container {
    width: 86px; /* 缩小固定宽度，使其更像一个紧凑的按钮 */
    box-sizing: border-box;
  }

  .swipe-track {
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    gap: 0;
  }

  .swipe-track::-webkit-scrollbar {
    display: none;
  }

  .picker-item {
    flex: 0 0 100%;
    scroll-snap-align: center;
    padding: 0; /* 清除默认 padding，避免挤压 */
  }

  /* 强制 span 占满整个项目宽度并居中，解决背景色边缘不齐的问题 */
  .picker-item span {
    display: block;
    width: 100%;
    text-align: center;
    box-sizing: border-box;
    padding: 4px 0; /* 移除左右固定 padding，依靠宽度自动填充 */
  }
}
</style>