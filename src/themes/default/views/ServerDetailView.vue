<template>
  <div class="public-layout">
    <PublicHeader
      :siteName="siteSettings.site_name"
      :siteDesc="siteSettings.site_desc"
      @open-login="handleAdminClick"
    />

    <DetailControlBar
      :server="server"
      :online="isOnline(server?.last_active)"
      v-model:activeTab="activeTab"
      @back="goBack"
    />

    <main class="detail-main-content">
      <div v-if="loading && !server" class="loading-state">
        <div class="spinner"/>
      </div>
      <div v-else class="tabs-wrapper">
        <TabOverview v-if="activeTab === 'overview'" :server="server" />
        <TabCharts v-if="activeTab === 'charts'" :server="server" />
      </div>
    </main>

    <LoginModal :show="showLogin" @close="showLogin = false" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/utils/request.js'
import { useServerStore } from '@/store/server.js'
import { useAuthStore } from '@/store/auth.js' // 🌟 新增鉴权 Store 导入

import PublicHeader     from '@/themes/default/components/PublicHeader.vue'
import LoginModal       from '@/themes/default/components/LoginModal.vue'
import DetailControlBar from '@/themes/default/components/server-detail/DetailControlBar.vue'
import TabOverview      from '@/themes/default/components/server-detail/TabOverview.vue'
import TabCharts        from '@/themes/default/components/server-detail/TabCharts.vue'

const route  = useRoute()
const router = useRouter()
const serverStore = useServerStore()
const authStore = useAuthStore() // 🌟 初始化鉴权 Store

const activeTab    = ref('overview')
const siteSettings = ref({})
const showLogin    = ref(false)

// 🌟 新增带鉴权的点击跳转逻辑
const handleAdminClick = () => {
  if (authStore.isLoggedIn) {
    router.push('/admin')
  } else {
    showLogin.value = true
  }
}

const goBack = () => router.push('/')

const server = computed(() => serverStore.servers.find(s => s.node_id === route.params.id) || null)
const loading = computed(() => serverStore.loading && !server.value)

const loadPublicSettings = async () => {
  try {
    siteSettings.value = await request.get('/api/public/settings') || {}
  } catch (e) {
    console.error('Failed to load settings', e)
  }
}

watch(() => server.value?.name, (newName) => {
  if (newName) document.title = `${newName} - ${siteSettings.value.site_name || '详情'}`
}, { immediate: true })

const isOnline = (lastActive) => {
  if (!lastActive) return false;
  const threshold = parseInt(siteSettings.value.offline_threshold) || 180;
  return (Date.now() / 1000) - lastActive < threshold;
}

onMounted(async () => {
  await loadPublicSettings()
  serverStore.startPolling(false)
})
</script>

<style scoped>
.public-layout {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100vh;
  background: var(--bg-color, #f8fafc);
}
.detail-main-content {
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.loading-state { padding: 100px; text-align: center; color: #94a3b8; }
.spinner {
  width: 24px; height: 24px;
  border: 2px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}
@keyframes spin { to { transform: rotate(360deg); } }
.tabs-wrapper { position: relative; flex: 1; width: 100%; display: flex; flex-direction: column; }
</style>