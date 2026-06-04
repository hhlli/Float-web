<template>
  <div class="load-detail-container">
    <div v-for="(item, index) in loadData" :key="item.label" class="load-row">
      <span class="load-label">{{ item.label }}</span>
      <div class="load-track">
        <div class="load-fill" :class="{ 'is-active': index === 0 }" :style="{ width: item.pct + '%' }"></div>
      </div>
      <span class="load-val">{{ item.val }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  server: Object
})

const loadData = computed(() => {
  const s = props.server || {}
  const l1 = s.load_1 || 0
  const l5 = s.load_5 || 0
  const l15 = s.load_15 || 0
  
  const maxLoad = Math.max(l1, l5, l15, 1)
  
  return [
    { label: '1m', val: l1.toFixed(2), pct: (l1 / maxLoad) * 100 },
    { label: '5m', val: l5.toFixed(2), pct: (l5 / maxLoad) * 100 },
    { label: '15m', val: l15.toFixed(2), pct: (l15 / maxLoad) * 100 }
  ]
})
</script>

<style scoped>
.load-detail-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  height: 100%;
  width: 100%;
}

.load-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.load-label {
  width: 24px;
  font-size: 12px;
  color: var(--text-muted);
}

.load-track {
  flex: 1;
  height: 6px;
  background: var(--border-color); /* 使用统一的极浅灰色作为轨道底色，去掉了生硬的 border */
  border-radius: 3px;
  overflow: hidden;
}

.load-fill {
  height: 100%;
  background: #3b82f6; /* 柔和的现代蓝，呼应界面中的活动元素 */
  opacity: 0.3; /* 5m 和 15m 降低透明度，显得更轻量 */
  transition: width 0.4s ease;
  border-radius: 3px;
}

.load-fill.is-active {
  opacity: 0.85; /* 1m 提高不透明度，作为主要视觉焦点 */
}

.load-val {
  width: 32px;
  text-align: right;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}
</style>