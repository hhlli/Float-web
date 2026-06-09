<template>
  <aside class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-header">
      <button class="collapse-btn" @click="isCollapsed = !isCollapsed" title="折叠/展开侧边栏">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      <span class="header-text">Float</span>
      <div class="version-container" v-show="!isCollapsed && siteSettings?.server_version">
        <span class="version-tag">
          {{ siteSettings.server_version }}
        </span>
        <a v-if="siteStore.hasUpdate" href="https://github.com/hhlli/Float/releases" target="_blank" class="update-arrow" title="有新版本可用">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>
        </a>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div :class="['nav-item', { active: route.path.includes('/admin/servers') }]" @click="goTo('/admin/servers')" title="服务器">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
        <span class="nav-text">服务器</span>
      </div>

      <div class="nav-item-group">
        <div class="nav-item" @click="toggleGroup('notify')" title="通知">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          <span class="nav-text">通知</span>
          <svg v-if="!isCollapsed" class="chevron" :class="{ open: isNotifyOpen }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
        <Transition name="expand">
  <div class="sub-nav-grid" v-show="isNotifyOpen && !isCollapsed">
    <div class="sub-nav">
      <div :class="['nav-item-sub', { active: route.query.tab === 'notification' }]" @click="goTo('/admin/settings', 'notification')">通知设置</div>
      <div :class="['nav-item-sub', { active: route.query.tab === 'notify' }]" @click="goTo('/admin/settings', 'notify')">通知规则</div>
      <div :class="['nav-item-sub', { active: route.query.tab === 'integration' }]" @click="goTo('/admin/settings', 'integration')">集成设置</div>
    </div>
  </div>
</Transition>
      </div>

      <div :class="['nav-item', { active: route.path.includes('/admin/latency') }]" @click="goTo('/admin/latency')" title="延迟监测">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
        <span class="nav-text">延迟监测</span>
      </div>

      <div class="nav-item-group">
        <div class="nav-item" @click="toggleGroup('settings')" title="系统设置">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          <span class="nav-text">系统设置</span>
          <svg v-if="!isCollapsed" class="chevron" :class="{ open: isSettingsOpen }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
        <Transition name="expand">
          <div class="sub-nav-grid" v-show="isSettingsOpen && !isCollapsed">
            <div class="sub-nav">
              <div :class="['nav-item-sub', { active: route.query.tab === 'account' }]" @click="goTo('/admin/settings', 'account')">账户设置</div>
              <div :class="['nav-item-sub', { active: route.query.tab === 'site' }]" @click="goTo('/admin/settings', 'site')">站点配置</div>
              <div :class="['nav-item-sub', { active: route.query.tab === 'general' }]" @click="goTo('/admin/settings', 'general')">通用设置</div>
              <div :class="['nav-item-sub', { active: route.query.tab === 'session' }]" @click="goTo('/admin/settings', 'session')">会话管理</div>
            </div>
          </div>
        </Transition>
      </div>
      
      <div :class="['nav-item', { active: route.path.includes('/admin/theme') }]" @click="goTo('/admin/theme')" title="主题外观">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="13.5" cy="6.5" r=".5"></circle>
          <circle cx="17.5" cy="10.5" r=".5"></circle>
          <circle cx="8.5" cy="7.5" r=".5"></circle>
          <circle cx="6.5" cy="12.5" r=".5"></circle>
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
        </svg>
        <span class="nav-text">主题外观</span>
      </div>
      
      <div :class="['nav-item', { active: route.path.includes('/admin/logs') }]" @click="goTo('/admin/logs')" title="系统日志">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
        <span class="nav-text">系统日志</span>
      </div>
      
      <div :class="['nav-item', { active: route.path.includes('/admin/docs') }]" @click="goTo('/admin/docs')" title="使用文档">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
        <span class="nav-text">使用文档</span>
      </div>

      <div :class="['nav-item', { active: route.path.includes('/admin/about') }]" @click="goTo('/admin/about')" title="关于">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        <span class="nav-text">关于</span>
      </div>
      
      <div class="nav-item" @click="goTo('/')" title="返回前台">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        <span class="nav-text">返回前台</span>
      </div>

      <div style="flex: 1;"></div>

      <div class="nav-item nav-danger" @click="handleLogout" title="退出登录">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        <span class="nav-text">退出登录</span>
      </div>
    </nav>
  </aside>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import request from '@/utils/request.js'
import { useAuthStore } from '@/store/auth.js'
import { useSiteStore } from '@/store/site.js' // 新增引入

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const siteStore = useSiteStore() // 初始化 store

// 1. 记录初始的屏幕状态 (是否为移动端/窄屏)
let wasMobile = window.innerWidth <= 768

// 初始化折叠状态
const isCollapsed = ref(wasMobile)
const isSettingsOpen = ref(false)
const isNotifyOpen = ref(false)

const siteSettings = ref({})

// 2. 修改 resize 逻辑，仅在跨越断点时改变状态，避免持续触发
const handleResize = () => {
  const isMobile = window.innerWidth <= 768
  if (isMobile && !wasMobile) {
    // 从宽屏缩小为窄屏时，自动收起
    isCollapsed.value = true
  } else if (!isMobile && wasMobile) {
    // 从窄屏放大为宽屏时，自动展开
    isCollapsed.value = false
  }
  wasMobile = isMobile
}

onMounted(async () => {
  window.addEventListener('resize', handleResize)

  if (['account', 'site', 'general'].includes(route.query.tab)) isSettingsOpen.value = true
  if (['notification', 'notify'].includes(route.query.tab)) isNotifyOpen.value = true

  try {
    const res = await request.get('/api/public/settings')
    if (res) {
      siteSettings.value = res
    }
  } catch (error) {
    console.error('获取服务端版本号失败:', error)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const goTo = (path, subTab = null) => {
  if (subTab) {
    router.push({ path, query: { tab: subTab } })
  } else {
    router.push(path)
  }
  // 窄屏状态下，点击菜单跳转后自动收起侧边栏
  if (window.innerWidth <= 768) {
    isCollapsed.value = true
  }
}

const toggleGroup = (groupName) => {
  const targetRef = groupName === 'notify' ? isNotifyOpen : isSettingsOpen
  if (isCollapsed.value) {
    isCollapsed.value = false
    targetRef.value = true
  } else {
    targetRef.value = !targetRef.value
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}
</script>

<style scoped>
.sidebar-header {
  white-space: nowrap;
}

.header-text {
  font-size: 18px;
  font-weight: 600;
}

.version-tag {
  font-size: 12px;
  font-weight: 300;
  color: var(--text-muted); 
  margin-top: 2px;
}

.sidebar {
  transition: width 0.25s ease, min-width 0.25s ease;
  width: 220px; 
  min-width: 220px;
}

.sidebar.collapsed {
  width: 56px;
  min-width: 56px;
}

.sidebar.collapsed .header-text,
.sidebar.collapsed .nav-text,
.sidebar.collapsed .version-tag {
  display: none;
}

.sidebar.collapsed .nav-item,
.sidebar.collapsed .sidebar-header {
  justify-content: center;
  padding-left: 0;
  padding-right: 0;
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: inherit;
  flex-shrink: 0;
  padding: 0;
  transition: background-color 0.2s;
}

.collapse-btn:hover {
  background: var(--border-color); 
}

/* 二级菜单展开/收起过渡动画 (Grid方案) */
.expand-enter-active,
.expand-leave-active {
  transition: grid-template-rows 0.2s ease-out, opacity 0.2s ease-out;
  display: grid;
}

.expand-enter-from,
.expand-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  grid-template-rows: 1fr;
  opacity: 1;
}

.sub-nav {
  min-height: 0; 
  margin-top: 0; 
  margin-bottom: 0;
}

/* 追加在 style 标签最底部 */
@media (max-width: 480px) {
  .sidebar {
    width: 200px;
    min-width: 200px;
  }
}
.version-container {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}

.update-arrow {
  color: #10b981; /* 绿色提示，可根据主题修改 */
  display: inline-flex;
  align-items: center;
  animation: bounce 2s infinite;
}

.update-arrow:hover {
  color: #059669;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}
</style>