<template>
  <header class="top-navbar" style="max-width: 1440px; width: 100%; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
    <div class="page-title" style="display: flex; align-items: center; gap: 10px;">
      <div style="display: flex; align-items: baseline; gap: 8px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="align-self: center;">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        
        <span class="main-title">{{ siteName || '服务器状态' }}</span>
        
        <span v-if="siteDesc" class="site-subtitle">
          {{ siteDesc }}
        </span>
      </div>
    </div>
    
    <div style="display: flex; align-items: center; gap: 16px;">
      <div class="theme-actions" style="display: flex; gap: 8px;">
        <button class="icon-btn" @click="toggleThemeColor" title="切换主题色">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
        </button>
        <button class="icon-btn" @click="toggleDarkMode" title="切换夜间模式">
          <svg v-if="!isDark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
        </button>
      </div>

      <button class="btn-primary" @click="$emit('open-login')" style="display: flex; align-items: center; gap: 6px; padding: 8px 16px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
          <polyline points="10 17 15 12 10 7"></polyline>
          <line x1="15" y1="12" x2="3" y2="12"></line>
        </svg>
        管理后台
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  siteName: {
    type: String,
    default: '服务器状态'
  },
  siteDesc: {
    type: String,
    default: ''
  }
})

defineEmits(['open-login'])

// 主题与夜间模式逻辑
const isDark = ref(false)
const themes = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899']
let themeIndex = 0

const toggleDarkMode = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

const toggleThemeColor = () => {
  themeIndex = (themeIndex + 1) % themes.length
  document.documentElement.style.setProperty('--primary-color', themes[themeIndex])
}
</script>

<style scoped>
.main-title {
  font-weight: 600;
  font-size: 1.1rem;
}

.site-subtitle {
  font-size: 13px;
  opacity: 0.45;
  font-weight: normal;
  margin-left: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.icon-btn {
  background: transparent;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted, #64748b);
  transition: all 0.2s;
}

.icon-btn:hover {
  background: var(--surface-color, #f1f5f9);
  color: var(--primary-color, #3b82f6);
  border-color: var(--primary-color, #3b82f6);
}
</style>