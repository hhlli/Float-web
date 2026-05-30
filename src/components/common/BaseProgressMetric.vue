<template>
  <div class="metric-block">
    <div class="metric-text">
      <span class="label">{{ label }}</span>
      <span class="value">{{ displayValue }}</span>
    </div>
    <div class="progress-track">
      <div 
        class="progress-fill" 
        :style="{ width: percent + '%', background: color }"
      ></div>
    </div>
    <div class="metric-subtext" v-if="subtext">{{ subtext }}</div>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  displayValue: { type: String, required: true },
  percent: { type: Number, required: true },
  color: { type: String, default: '#10b981' }, // 默认值改为固定绿色，防止未传参时使用主题色
  subtext: { type: String, default: '' }
})
</script>

<style scoped>
.metric-block { display: flex; flex-direction: column; }
.metric-text { display: flex; justify-content: space-between; margin-bottom: 6px; }
.metric-text .label { color: var(--text-muted); font-weight: 600; font-size: 13px; }
.metric-text .value { color: var(--text-main); font-weight: 600; font-size: 13px; }
.progress-track { height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease, background-color 0.4s ease; }
.metric-subtext { font-size: 13px; color: var(--text-muted); margin-top: 6px; }
</style>