<template>
  <div id="public-layout" style="padding: 16px; display: flex; flex-direction: column; gap: 16px; min-height: 100vh;">
    
    <template v-if="!isPrivateSite || authStore.token">
      <PublicHeader
        :siteName="siteSettings.site_name"
        :siteDesc="siteSettings.site_desc"
        :siteLogo="siteSettings.site_icon"
        @open-login="handleAdminClick"
      />

      <PublicToolbar
        :serverCount="processedServers.length"
        :onlineCount="onlineCount"
        :offlineCount="offlineCount"
        :totalTrafficTx="totalTrafficTx"
        :totalTrafficRx="totalTrafficRx"
        :totalSpeedTx="totalSpeedTx"
        :totalSpeedRx="totalSpeedRx"
        v-model:searchQuery="searchQuery"
        v-model:filterBy="filterBy"
        v-model:sortBy="sortBy"
        v-model:groupBy="groupBy"
        v-model:cardStyle="cardStyle"
        :styleOptions="selectOptions"
      />

      <main class="public-container" style="max-width: 1440px; width: 100%; margin: 0 auto; padding: 0; flex: 1;">
        <div v-if="processedServers.length === 0" class="empty-state" style="text-align: center; padding: 60px;">
          暂无公开展示的节点或正在加载...
        </div>

        <template v-else-if="currentStyleConfig?.isGlobal">
          <component :is="currentStyleConfig.component" :servers="processedServers" @show-detail="handleShowDetail" />
        </template>

        <template v-else-if="groupBy !== 'none'">
          <div v-for="(group, key) in groupedServers" :key="key" class="group-wrap">
            <div class="group-header">
              <span class="group-title">{{ key }}</span>
              <span class="group-badge">{{ group.length }}</span>
            </div>
            <div class="server-grid">
              <component 
                :is="currentStyleConfig.component" 
                v-for="s in group" 
                :key="s.node_id" 
                :server="s" 
                @show-detail="handleShowDetail" 
              />
            </div>
          </div>
        </template>

        <div v-else class="server-grid">
          <component 
            :is="currentStyleConfig.component" 
            v-for="s in processedServers" 
            :key="s.node_id" 
            :server="s" 
            @show-detail="handleShowDetail" 
          />
        </div>
      </main>

      <footer 
        v-if="siteSettings?.custom_footer" 
        class="public-footer custom-footer" 
        style="text-align: center; width: 100%; font-size: 16px; padding: 3px 0 3px 0; opacity: 0.6;"
        v-html="siteSettings.custom_footer"
      ></footer>
    </template>

    <LoginModal
      :show="showLogin"
      :preventRedirect="isPrivateLogin"
      :title="isPrivateLogin ? '隐私站点请登陆' : '系统登录'"
      :subtitle="isPrivateLogin ? '该站点已开启隐私保护' : '管理中枢身份验证'"
      @close="showLogin = false"
      @success="onLoginSuccess"
    />

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
// 移除：import request from '@/utils/request.js'
import { useSiteStore } from '@/store/site.js' // 新增引入全局配置 Store
import { useAuthStore } from '@/store/auth.js'
import { useServerStore } from '@/store/server.js'
import { isOnline, formatBytes, formatSpeed } from '@/utils/format.js'

// 修正：全部改为相对路径，指向当前主题下的组件
import PublicHeader from '../components/PublicHeader.vue'
import LoginModal   from '../components/LoginModal.vue'
import PublicToolbar from '../components/PublicToolbar.vue'
import { cardStyles } from '../components/card-styles/index.js'

const router       = useRouter()
const authStore    = useAuthStore()
const serverStore  = useServerStore()
const siteStore    = useSiteStore() // 实例化配置 Store

const showLogin    = ref(false)
const siteSettings = ref({})
const cardStyle    = ref(localStorage.getItem('cardStyle') || 'default')

const searchQuery    = ref('') 
const filterBy       = ref('all')
const sortBy         = ref('default')
const groupBy        = ref('none')
const isPrivateSite  = ref(false)
const isPrivateLogin = ref(false)

const servers = computed(() => serverStore.servers)
const selectOptions = cardStyles.map(({ value, label, desc }) => ({ value, label, desc }))

const currentStyleConfig = computed(() => cardStyles.find(o => o.value === cardStyle.value) || cardStyles[0])

watch(cardStyle, val => localStorage.setItem('cardStyle', val))

const onlineCount = computed(() => servers.value.filter(s => isOnline(s.last_active)).length)
const offlineCount = computed(() => servers.value.length - onlineCount.value)

const totalTrafficTx = computed(() => formatBytes(servers.value.reduce((sum, s) => sum + (s.net_tx_total || 0), 0)))
const totalTrafficRx = computed(() => formatBytes(servers.value.reduce((sum, s) => sum + (s.net_rx_total || 0), 0)))
const totalSpeedTx = computed(() => formatSpeed(servers.value.reduce((sum, s) => sum + (s.net_tx_speed || 0), 0)))
const totalSpeedRx = computed(() => formatSpeed(servers.value.reduce((sum, s) => sum + (s.net_rx_speed || 0), 0)))

const processedServers = computed(() => {
  let list = [...servers.value]
  if (searchQuery.value) {
    const kw = searchQuery.value.toLowerCase()
    list = list.filter(s => (s.name && s.name.toLowerCase().includes(kw)) || (s.region && s.region.toLowerCase().includes(kw)))
  }
  if (filterBy.value === 'online') list = list.filter(s => isOnline(s.last_active))
  if (filterBy.value === 'offline') list = list.filter(s => !isOnline(s.last_active))
  if (sortBy.value === 'cpu') list.sort((a, b) => (b.cpu || 0) - (a.cpu || 0))
  if (sortBy.value === 'network') list.sort((a, b) => ((b.net_tx_speed || 0) + (b.net_rx_speed || 0)) - ((a.net_tx_speed || 0) + (a.net_rx_speed || 0)))
  return list
})

const groupedServers = computed(() => {
  if (groupBy.value === 'none') return {}
  return processedServers.value.reduce((acc, s) => {
    const key = groupBy.value === 'region' ? (s.region || 'Unknown') : (s.tag || 'Default')
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})
})

const handleShowDetail = (serverData) => router.push({ name: 'ServerDetail', params: { id: serverData.node_id } })

const handleAdminClick = () => {
  if (authStore.isLoggedIn) { router.push('/admin') } else { isPrivateLogin.value = false; showLogin.value = true }
}

const onLoginSuccess = () => { if (isPrivateLogin.value) serverStore.startPolling(false) }

// 修正：直接读取 Vuex/Pinia 中由路由前置获取的数据，避免重复请求
const loadPublicSettings = () => {
  const data = siteStore.settings
  siteSettings.value = data || {}
  
  if (data?.site_name) document.title = data.site_name
  isPrivateSite.value = String(data?.require_login) === 'true' || String(data?.require_login) === '1'

  if (!isPrivateSite.value || authStore.token) {
    serverStore.startPolling(false)
  } else {
    isPrivateLogin.value = true 
    showLogin.value = true
  }
}

onMounted(() => loadPublicSettings())
</script>

<style scoped>
/* 引入该主题专属的全局样式，隔离于后台 */
@import '../assets/main.css';
</style>