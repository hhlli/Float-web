<template>
  <div id="admin-layout" class="active">
    
    <AdminSidebar v-show="sidebarVisible" :currentPath="$route.path" @update:tab="handleTabChange" @collapse="sidebarVisible = false" />

    <main class="main-wrapper">
      
      <AdminHeader :title="pageTitle" :sidebarVisible="sidebarVisible" @show-sidebar="sidebarVisible = true" />

      <div class="content-area">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// 导入布局组件
import AdminSidebar from '../components/admin/layout/AdminSidebar.vue'
import AdminHeader from '../components/admin/layout/AdminHeader.vue'

const router = useRouter()
const route = useRoute()

const sidebarVisible = ref(true)

/**
 * 🌟 动态计算标题
 * 优先读取 query.tab 的二级页面标题，其次读取路由 meta 配置
 */
const pageTitle = computed(() => {
  // 1. 优先判断是否有二级 Tab 参数 (处理通知和设置下的子菜单)
  const tab = route.query.tab
  if (tab === 'notification') return '通知设置'
  if (tab === 'notify') return '通知规则'
  if (tab === 'account') return '账户设置'
  if (tab === 'site') return '站点配置'

  // 2. 其次读取 router/index.js 中配置的 meta.title
  if (route.meta && route.meta.title) {
    return route.meta.title
  }

  // 3. 默认兜底
  return '管理后台'
})

// 处理来自侧边栏的切换事件
const handleTabChange = (payload) => {
  // 核心修改：改为执行路由跳转
  if (payload.path) {
    router.push(payload.path)
  } else if (payload.tab) {
    router.push(`/admin/${payload.tab}`)
  }
}
</script>

<style scoped>
/* 保持原有的 transition 样式不变 */
.fade-enter-active, .fade-leave-active { 
  transition: opacity 0.2s ease, transform 0.2s ease; 
}
.fade-enter-from, .fade-leave-to { 
  opacity: 0; 
  transform: translateY(10px); 
}
</style>