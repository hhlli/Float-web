<template>
  <div class="matrix-tabs">
    <span 
      v-for="opt in options" 
      :key="opt.value"
      class="tab-btn" 
      :class="{ active: modelValue === opt.value }" 
      @click="$emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  modelValue: String,
  options: Array
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.matrix-tabs {
  display: flex;
  gap: 12px;
  align-items: center;
}

.tab-btn {
  cursor: pointer;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  color: #2a5a40; /* 暗绿色 */
  font-weight: 600;
  transition: all 0.2s;
  user-select: none;
}

.tab-btn::before { content: '['; margin-right: 4px; }
.tab-btn::after { content: ']'; margin-left: 4px; }

.tab-btn:hover {
  color: #a0ffcc;
}

.tab-btn.active {
  color: #00ff88;
  text-shadow: 0 0 8px rgba(0, 255, 136, 0.6);
}
</style>