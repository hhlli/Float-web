<template>
  <span class="status-badge" :class="online ? 'online' : 'offline'">
    {{ displayText }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  online: {
    type: Boolean,
    required: true
  },
  // 可选：覆盖默认文本（例如传入 'Online' 或 '在线'）
  text: {
    type: String,
    default: ''
  }
})

const displayText = computed(() => {
  if (props.text) return props.text
  return props.online ? '在线' : '离线'
})
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px; /* 移除垂直 padding，保留水平 padding */
  height: 22px; /* 定义固定高度 */
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid transparent;
  white-space: nowrap;
  box-sizing: border-box;
}

.status-badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status-badge.online {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.2);
}

.status-badge.offline {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}
</style>