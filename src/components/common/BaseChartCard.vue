<template>
  <div class="chart-card">
    <div class="card-top">
      <div class="card-meta">
        <span class="card-label">{{ title }}</span>
        <span v-if="subHeader" class="card-sub">{{ subHeader }}</span>
      </div>
      <div class="card-value" :style="valueColor ? { color: valueColor } : {}">
        {{ currentValue }}
      </div>
    </div>

    <div v-if="percent !== undefined" class="progress-bar">
      <div class="progress-fill" :style="{ width: `${Math.min(percent, 100)}%`, background: progressColor }"/>
    </div>

    <div class="card-chart">
      <slot/>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title:        String,
  currentValue: [String, Number],
  subHeader:    String,
  percent:      Number,        // 0-100，有值则显示进度条
  valueColor:   String,        // 强制指定数值颜色
})

const progressColor = computed(() => {
  if (props.percent === undefined) return '#3b82f6'
  if (props.percent > 90) return '#ef4444'
  if (props.percent > 75) return '#f59e0b'
  return '#10b981'
})
</script>

<style scoped>
.chart-card {
  background: var(--surface-color, #fff);
  border-radius: 12px;
  border: 1px solid var(--border-color, #e2e8f0);
  padding: 16px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-sub {
  font-size: 11px;
  color: var(--text-muted, #94a3b8);
}

.card-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-main, #1e293b);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  white-space: nowrap;
}

/* 进度条 */
.progress-bar {
  height: 3px;
  background: var(--border-color, #e2e8f0);
  border-radius: 99px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.4s ease, background 0.4s ease;
}

/* 图表区：无内边距，紧贴底部 */
.card-chart {
  margin: 0 -16px;
  flex: 1;
}
</style>