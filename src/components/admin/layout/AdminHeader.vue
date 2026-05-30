<template>
  <header class="top-navbar">
    <div class="page-title">{{ title }}</div>
    <div class="theme-actions">
      <button class="action-btn custom-size" @click="toggleThemeColor" title="切换主题色">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
      </button>
      <button class="action-btn custom-size" @click="toggleDarkMode" title="切换夜间模式">
        <svg v-if="!isDark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
      </button>
    </div>
  </header>
</template>

<script setup>
import { useThemeControl } from '@/composables/useThemeControl.js'

defineProps({
  title: String,
  sidebarVisible: Boolean
})

defineEmits(['show-sidebar'])

const { isDark, toggleDarkMode, toggleThemeColor } = useThemeControl()
</script>

<style scoped>
.action-btn.custom-size {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: var(--radius-md) !important;
}

.action-btn.custom-size svg {
  width: 18px;
  height: 18px;
}
</style>