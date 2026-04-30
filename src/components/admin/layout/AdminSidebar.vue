<template>
  <aside class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-header">
      <button class="collapse-btn" @click="isCollapsed = !isCollapsed" title="折叠/展开侧边栏">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      <span class="header-text">Float</span>
      <span class="version-tag" v-show="!isCollapsed && siteSettings?.server_version">
    {{ siteSettings.server_version }}
  </span>
    </div>
    <nav class="sidebar-nav">
      <div :class="['nav-item', { active: route.path.includes('/admin/servers') }]" @click="goTo('/admin/servers')" title="服务器">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
        <span class="nav-text">服务器</span>
      </div>

      <div class="nav-item-group">
        <div class="nav-item" @click="isNotifyOpen = !isNotifyOpen" title="通知">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          <span class="nav-text">通知</span>
          <svg v-if="!isCollapsed" class="chevron" :class="{ open: isNotifyOpen }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
        <div class="sub-nav" v-show="isNotifyOpen && !isCollapsed">
          <div :class="['nav-item-sub', { active: route.query.tab === 'notification' }]" @click="goTo('/admin/settings', 'notification')">通知设置</div>
          <div :class="['nav-item-sub', { active: route.query.tab === 'notify' }]" @click="goTo('/admin/settings', 'notify')">通知规则</div>
        </div>
      </div>

      <div :class="['nav-item', { active: route.path.includes('/admin/latency') }]" @click="goTo('/admin/latency')" title="延迟监测">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
        <span class="nav-text">延迟监测</span>
      </div>

      <div class="nav-item-group">
        <div class="nav-item" @click="isSettingsOpen = !isSettingsOpen" title="系统设置">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          <span class="nav-text">系统设置</span>
          <svg v-if="!isCollapsed" class="chevron" :class="{ open: isSettingsOpen }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
        <div class="sub-nav" v-show="isSettingsOpen && !isCollapsed">
          <div :class="['nav-item-sub', { active: route.query.tab === 'account' }]" @click="goTo('/admin/settings', 'account')">账户设置</div>
          <div :class="['nav-item-sub', { active: route.query.tab === 'site' }]" @click="goTo('/admin/settings', 'site')">站点配置</div>
        </div>
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
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
// 🌟 1. 引入网络请求工具 (注意相对路径，根据你的目录结构向上找 utils 文件夹)
import request from '../../../utils/request.js'

const router = useRouter()
const route = useRoute()

const isCollapsed = ref(false)
const isSettingsOpen = ref(false)
const isNotifyOpen = ref(false)

// 🌟 2. 声明一个响应式变量，用来保存从后端获取的配置（包含 server_version）
const siteSettings = ref({})

// 🌟 3. 将 onMounted 改为 async 异步函数，以便在组件加载时请求数据
onMounted(async () => {
  // 原有的展开逻辑
  if (['account', 'site'].includes(route.query.tab)) isSettingsOpen.value = true
  if (['notification', 'notify'].includes(route.query.tab)) isNotifyOpen.value = true

  // 🌟 4. 请求后端公开配置接口，赋值给 siteSettings
  try {
    const res = await request.get('/api/public/settings')
    if (res) {
      siteSettings.value = res
    }
  } catch (error) {
    console.error('获取服务端版本号失败:', error)
  }
})

const goTo = (path, subTab = null) => {
  if (subTab) {
    router.push({ path, query: { tab: subTab } })
  } else {
    router.push(path)
  }
}

const handleLogout = () => {
  localStorage.removeItem('server_token')
  router.push('/')
}
</script>

<style scoped>

.sidebar-header {
  display: flex;
  align-items: center; /* 修复图标与 Float 文字的垂直居中 */
  gap: 6px;
  white-space: nowrap;
}

.header-text {
  font-size: 18px;
  font-weight: 600;
}

.version-tag {
  font-size: 12px;
  font-weight: 300;       /* 核心：设置最细字重 */
  color: #94a3b8;
  margin-top: 2px; /* 在 center 对齐下进行微调，使其视觉上贴近基线 */
}

.sidebar {
  width: 220px;
  min-width: 220px;
  transition: width 0.25s ease, min-width 0.25s ease;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 56px;
  min-width: 56px;
}

/* 折叠时隐藏文字 */
.sidebar.collapsed .header-text,
.sidebar.collapsed .nav-text {
  display: none;
}

/* 折叠时图标居中 */
.sidebar.collapsed .nav-item {
  justify-content: center;
  padding-left: 0;
  padding-right: 0;
}

.sidebar.collapsed .sidebar-header {
  justify-content: center;
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
}
.collapse-btn:hover {
  background: var(--hover-bg, rgba(0,0,0,0.06));
}
</style>
