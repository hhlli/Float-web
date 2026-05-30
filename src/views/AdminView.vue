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
import { ref, computed, onMounted, onUnmounted } from 'vue' // 🌟 新增生命周期钩子
import { useRouter, useRoute } from 'vue-router'
import { useServerStore } from '@/store/server.js' // 🌟 引入 Store

// 导入布局组件
import AdminSidebar from '@/components/admin/layout/AdminSidebar.vue'
import AdminHeader from '@/components/admin/layout/AdminHeader.vue'

const router = useRouter()
const route = useRoute()
const serverStore = useServerStore() // 🌟 实例化 Store

const sidebarVisible = ref(true)

/**
 * 🌟 动态计算标题
 */
const pageTitle = computed(() => {
  const tab = route.query.tab
  if (tab === 'notification') return '通知设置'
  if (tab === 'notify') return '通知规则'
  if (tab === 'account') return '账户设置'
  if (tab === 'site') return '站点配置'

  if (route.meta && route.meta.title) {
    return route.meta.title
  }

  return '管理后台'
})

// 处理来自侧边栏的切换事件
const handleTabChange = (payload) => {
  if (payload.path) {
    router.push(payload.path)
  } else if (payload.tab) {
    router.push(`/admin/${payload.tab}`)
  }
}

// 🌟 生命周期控制 Admin 专属的数据流
onMounted(() => {
  // 传入 true，代表请求 /api/admin/servers/static
  serverStore.startPolling(true)
})

onUnmounted(() => {
  serverStore.stopPolling()
})
</script>