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
      <div class="progress-fill" :style="{ width: `${Math.min(percent, 100)}%`, background: getProgressColor(percent) }"/>
    </div>

    <div class="card-chart">
      <slot/>
    </div>
  </div>
</template>

<script setup>
import { getProgressColor } from '@/utils/format.js'

const props = defineProps({
  title:        String,
  currentValue: [String, Number],
  subHeader:    String,
  percent:      Number,        
  valueColor:   String,        
})
</script>

<style scoped>
.chart-card {
  background: var(--surface-color);
  border-radius: 12px;
  border: 1px solid var(--border-color);
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
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-sub {
  font-size: 11px;
  color: var(--text-muted);
}

.card-value {
  font-size: 16px;       /* 减小字号，原为 22px */
  font-weight: 600;      /* 降低字重，原为 700。600 为更具现代感的半粗体 */
  color: var(--text-main);
  font-variant-numeric: tabular-nums;
  line-height: 1.2;      /* 稍微拉开行高，原为 1 */
  white-space: nowrap;
  letter-spacing: 0.3px; /* 增加字母间距，提升长字符串的可读性 */
}

.progress-bar {
  height: 3px;
  background: var(--border-color);
  border-radius: 99px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.4s ease, background 0.4s ease;
}

.card-chart {
  margin: 0 -16px;
  flex: 1;
}
</style>