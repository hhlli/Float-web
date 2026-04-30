<template>
  <button class="btn-primary" @click="$emit('click')" :disabled="loading">
    {{ loading ? loadingText : text }}
  </button>
</template>

<script setup>
defineProps({
  loading: { type: Boolean, default: false },
  text: { type: String, default: '保存配置' },
  loadingText: { type: String, default: '保存中...' }
})
defineEmits(['click'])
</script>