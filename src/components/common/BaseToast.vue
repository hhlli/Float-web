<template>
  <transition name="toast">
    <div v-if="toastState.show" class="base-toast">
      <svg v-if="toastState.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="toast-icon success">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="toast-icon error">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      
      <span class="toast-text">{{ toastState.message }}</span>
    </div>
  </transition>
</template>

<script setup>
import { toastState } from '@/utils/toast.js'
</script>

<style scoped>
.base-toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface-color, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  color: var(--text-main, #1e293b);
  padding: 10px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  z-index: 9999;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  pointer-events: none;
}
.toast-icon { width: 16px; height: 16px; flex-shrink: 0; }
.toast-icon.success { color: #10b981; }
.toast-icon.error { color: #ef4444; }

.toast-enter-active, .toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>