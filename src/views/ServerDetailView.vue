<template>
  <div class="public-layout">
    <PublicHeader
      :siteName="siteSettings.site_name"
      :siteDesc="siteSettings.site_desc"
      @open-login="showLogin = true"
    />

    <DetailControlBar
      :server="server"
      :online="isOnline(server?.last_active)"
      v-model:activeTab="activeTab"
      v-model:chartType="chartType"
      v-model:activeRange="activeRange"
      v-model:smooth="isSmoothMode"
      @back="goBack"
    />

    <main class="detail-main-content">
      <div v-if="loading && !server" class="loading-state">
        <div class="spinner"/>
      </div>
      <div v-else class="tabs-wrapper">
        <TabOverview v-if="activeTab === 'overview'" :server="server" />
        <TabCharts
          v-if="activeTab === 'charts'"
          :server="server"
          :externalChartType="chartType"
          :externalRange="activeRange"
          :externalSmooth="isSmoothMode"
        />
      </div>
    </main>

    <LoginModal :show="showLogin" @close="showLogin = false" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../utils/request.js'

import PublicHeader     from '../components/public/PublicHeader.vue'
import LoginModal       from '../components/public/LoginModal.vue'
import DetailControlBar from '../components/public/server-detail/DetailControlBar.vue'
import TabOverview      from '../components/public/server-detail/TabOverview.vue'
import TabCharts        from '../components/public/server-detail/TabCharts.vue'

const route  = useRoute()
const router = useRouter()

const activeTab    = ref('overview')
const chartType    = ref('load')
const activeRange  = ref('realtime')
const isSmoothMode = ref(false)
const server       = ref(null)
const loading      = ref(true)
const siteSettings = ref({})
const showLogin    = ref(false)

watch(chartType, (val) => {
  if (val === 'network' && activeRange.value === 'realtime') {
    activeRange.value = '1h'
  }
})

const goBack = () => router.push('/')

const loadPublicSettings = async () => {
  siteSettings.value = await request.get('/api/public/settings') || {}
}

const fetchServerData = async () => {
  if (unmounted) return
  try {
    const data = await request.get('/api/public/servers')
    if (unmounted) return
    server.value = (data || []).find(s => s.node_id === route.params.id) || null
    if (server.value) {
      document.title = `${server.value.name} - ${siteSettings.value.site_name || '详情'}`
    }
  } catch (e) {
    console.error('fetchServerData error:', e)
  } finally {
    if (!unmounted) loading.value = false
  }
}

const isOnline = (lastActive) => {
  if (!lastActive) return false;
  // 动态读取后端传来的离线阈值，若无则使用 180s 作为保底
  const threshold = parseInt(siteSettings.value.offline_threshold) || 180;
  return (Date.now() / 1000) - lastActive < threshold;
}

let pollTimer = null
let unmounted = false

onMounted(async () => {
  await loadPublicSettings()
  await fetchServerData()
  pollTimer = setInterval(() => {
    if (!unmounted) fetchServerData()
  }, 5000)
})

onUnmounted(() => {
  unmounted = true
  clearInterval(pollTimer)
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