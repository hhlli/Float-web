<template>
  <div class="status-dot" :class="{ online: isOnline }"></div>
</template>

<script setup>
defineProps({
  isOnline: {
    type: Boolean,
    required: true,
    default: false
  }
})
</script>

<style scoped>
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444; /* 离线红色 */
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.4); /* 离线柔和发光 */
  position: relative;
  flex-shrink: 0;
  transition: background-color 0.3s, box-shadow 0.3s;
}

.status-dot.online {
  background: #10b981; /* 在线绿色 */
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4); /* 在线柔和发光 */
}
</style>