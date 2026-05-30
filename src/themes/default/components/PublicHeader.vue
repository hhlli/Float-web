<template>
  <header class="desktop-header">
    <div class="page-title">
      <div class="title-group">
        <img v-if="siteLogo" :src="siteLogo" alt="Site Logo" class="logo-image" />
        <svg v-else class="logo-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <span class="main-title">{{ siteName }}</span>
        <span v-if="siteDesc" class="site-subtitle">{{ siteDesc }}</span>
      </div>
    </div>
    
    <div class="desktop-actions">
      <div class="theme-actions">
        <button class="action-btn custom-size" @click="$emit('switch-lang')" title="切换语言">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
        </button>
        <a v-if="githubUrl" :href="githubUrl" target="_blank" class="action-btn custom-size" title="GitHub">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
        </a>
        <button class="action-btn custom-size" @click="toggleThemeColor" title="切换主题色">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
        </button>
        <button class="action-btn custom-size" @click="toggleDarkMode" title="切换夜间模式">
          <svg v-if="!isDark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
        </button>
      </div>

      <button class="btn-primary login-btn" @click="handleAdminClick">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
          <polyline points="10 17 15 12 10 7"></polyline>
          <line x1="15" y1="12" x2="3" y2="12"></line>
        </svg>
        管理后台
      </button>
    </div>

    <div class="mobile-actions">
      <BaseSelect
        v-model="mobileAction"
        :options="mobileOptions"
        class="header-fab-select"
      >
        <template #icon>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 12 12 17 22 12"></polyline>
            <polyline points="2 17 12 22 22 17"></polyline>
          </svg>
        </template>
      </BaseSelect>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/store/auth.js'
import BaseSelect from '@/components/common/BaseSelect.vue'
import { useThemeControl } from '@/composables/useThemeControl.js'

const props = defineProps({
  siteName: { type: String, default: '' },
  siteDesc: { type: String, default: '' },
  siteLogo: { type: String, default: '' },
  githubUrl: { type: String, default: 'https://github.com' }
})

const emit = defineEmits(['open-login', 'switch-lang'])

const router = useRouter()
const authStore = useAuthStore()
const { isLoggedIn } = storeToRefs(authStore)

const { isDark, toggleDarkMode, toggleThemeColor } = useThemeControl()

const handleAdminClick = () => {
  if (isLoggedIn.value) {
    router.push('/admin')
  } else {
    emit('open-login')
  }
}

const mobileAction = ref('menu')
const mobileOptions = computed(() => {
  const opts = []
  opts.push({ label: '切换语言', value: 'lang' })
  if (props.githubUrl) {
    opts.push({ label: '访问 GitHub', value: 'github' })
  }
  opts.push({ label: '主题颜色', value: 'theme' })
  opts.push({ label: '深色模式', value: 'dark' })
  opts.push({ label: '管理后台', value: 'login' })
  return opts
})

watch(mobileAction, (val) => {
  if (val === 'menu') return
  if (val === 'lang') emit('switch-lang')
  else if (val === 'github') window.open(props.githubUrl, '_blank')
  else if (val === 'theme') toggleThemeColor()
  else if (val === 'dark') toggleDarkMode()
  else if (val === 'login') {
    handleAdminClick()
  }
  nextTick(() => { mobileAction.value = 'menu' })
})
</script>

<style scoped>
/* 保持你的原版结构，不做任何删改 */
.desktop-header {
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--surface-color, #ffffff);
  border-radius: 12px;
  padding: 16px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.title-group { 
  display: flex; 
  align-items: center;
  gap: 8px; 
}

.logo-icon, .logo-image {
  display: block;
  width: 20px;
  height: 20px;
  object-fit: contain;
  border-radius: 2px;
}

.main-title { font-weight: 600; font-size: 1.1rem; color: var(--text-main); }
.site-subtitle { font-size: 13px; opacity: 0.45; margin-left: 4px; color: var(--text-muted); margin-top: 2px; }

.desktop-actions, .theme-actions { display: flex; align-items: center; gap: 16px; }
.theme-actions { gap: 8px; }

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

.login-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; }

/* 移动端菜单默认隐藏 */
.mobile-actions {
  display: none;
}

@media (max-width: 768px) {
  /* 核心：不再隐藏整个 Header，而是只隐藏右侧的桌面端按钮组 */
  .desktop-actions {
    display: none !important;
  }

  /* 显示被折叠成的单个下拉按钮 */
  .mobile-actions {
    display: block;
  }

  /* 修改你的原版悬浮按钮 CSS，使其变成 Header 内部的一个普通按钮 */
  :deep(.header-fab-select .select-trigger) {
    width: 36px !important;
    height: 36px !important;
    border-radius: var(--radius-md, 8px) !important;
    padding: 0 !important;
    background: transparent !important;
    border: 1px solid var(--border-color, #e2e8f0) !important;
    box-shadow: none !important;
    justify-content: center !important;
    color: var(--text-main, #1e293b) !important;
  }

  :deep(.header-fab-select .select-trigger span),
  :deep(.header-fab-select .select-trigger .chevron) {
    display: none !important;
  }

  :deep(.header-fab-select .select-trigger:hover) {
    background: var(--bg-color, #f8fafc) !important;
  }

  /* 控制下拉弹窗往下弹（原本是往上弹的） */
  :deep(.header-fab-select .select-dropdown) {
    top: calc(100% + 8px) !important;
    bottom: auto !important;
    right: 0 !important;
    left: auto !important;
    min-width: 150px !important;
    transform-origin: top right !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
  }

  /* 可选微调：防止窄屏时左侧副标题过长挤掉右侧按钮 */
  .site-subtitle {
    display: none;
  }
}
</style>