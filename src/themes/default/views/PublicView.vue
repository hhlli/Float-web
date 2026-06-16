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

      <div v-if="groupBy === 'region' && uniqueCountries.length > 0" class="country-scroll-nav">
        <div 
          class="country-tab"
          :class="{ active: selectedCountry === 'ALL' }"
          @click="selectedCountry = 'ALL'"
        >
          <span class="tab-flag">🌐</span>
          <span class="tab-name">ALL</span>
        </div>
        
        <div 
          v-for="country in uniqueCountries" 
          :key="country.code"
          class="country-tab"
          :class="{ active: selectedCountry === country.code }"
          @click="selectedCountry = country.code"
        >
          <span class="tab-flag">{{ country.emoji }}</span>
          <span class="tab-name">{{ country.code }}</span>
        </div>
      </div>

      <main class="public-container" style="max-width: 1440px; width: 100%; margin: 0 auto; padding: 0; flex: 1;">
        <div v-if="processedServers.length === 0" class="empty-state" style="text-align: center; padding: 60px;">
          暂无公开展示的节点或正在加载...
        </div>

        <template v-else-if="currentStyleConfig?.isGlobal">
          <component :is="currentStyleConfig.component" :servers="processedServers" @show-detail="handleShowDetail" />
        </template>

        <template v-else-if="groupBy !== 'none'">
          <div v-for="(group, key) in groupedServers" :key="key" class="group-wrap">
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
import { useSiteStore } from '@/store/site.js'
import { useAuthStore } from '@/store/auth.js'
import { useServerStore } from '@/store/server.js'
import { isOnline, formatBytes, formatSpeed, getFlagEmoji } from '@/utils/format.js'

import PublicHeader from '../components/PublicHeader.vue'
import LoginModal   from '../components/LoginModal.vue'
import PublicToolbar from '../components/PublicToolbar.vue'
import { cardStyles } from '../components/card-styles/index.js'

const router       = useRouter()
const authStore    = useAuthStore()
const serverStore  = useServerStore()
const siteStore    = useSiteStore()

const showLogin    = ref(false)
const siteSettings = ref({})
const cardStyle    = ref(localStorage.getItem('cardStyle') || 'default')

// 从 sessionStorage 读取历史状态，若无则使用默认值
const searchQuery    = ref(sessionStorage.getItem('searchQuery') || '') 
const filterBy       = ref(sessionStorage.getItem('filterBy') || 'all')
const sortBy         = ref(sessionStorage.getItem('sortBy') || 'default')
const groupBy        = ref(sessionStorage.getItem('groupBy') || 'none')
const isPrivateSite  = ref(false)
const isPrivateLogin = ref(false)
const selectedCountry= ref(sessionStorage.getItem('selectedCountry') || 'ALL')

const servers = computed(() => serverStore.servers)
const selectOptions = cardStyles.map(({ value, label, desc }) => ({ value, label, desc }))

const currentStyleConfig = computed(() => cardStyles.find(o => o.value === cardStyle.value) || cardStyles[0])

watch(cardStyle, val => localStorage.setItem('cardStyle', val))

watch([searchQuery, filterBy, sortBy, groupBy, selectedCountry], ([sq, fb, sb, gb, sc]) => {
  sessionStorage.setItem('searchQuery', sq)
  sessionStorage.setItem('filterBy', fb)
  sessionStorage.setItem('sortBy', sb)
  sessionStorage.setItem('groupBy', gb)
  sessionStorage.setItem('selectedCountry', sc)
})

const onlineCount = computed(() => servers.value.filter(s => isOnline(s.last_active)).length)
const offlineCount = computed(() => servers.value.length - onlineCount.value)

const totalTrafficTx = computed(() => formatBytes(servers.value.reduce((sum, s) => sum + (s.net_tx_total || 0), 0)))
const totalTrafficRx = computed(() => formatBytes(servers.value.reduce((sum, s) => sum + (s.net_rx_total || 0), 0)))
const totalSpeedTx = computed(() => formatSpeed(servers.value.reduce((sum, s) => sum + (s.net_tx_speed || 0), 0)))
const totalSpeedRx = computed(() => formatSpeed(servers.value.reduce((sum, s) => sum + (s.net_rx_speed || 0), 0)))

const COUNTRY_MAP = {
  'US': '美国', 'JP': '日本', 'HK': '中国香港', 'SG': '新加坡',
  'TW': '中国台湾', 'CN': '中国', 'KR': '韩国', 'GB': '英国',
  'DE': '德国', 'FR': '法国', 'NL': '荷兰', 'AU': '澳大利亚',
  'CA': '加拿大', 'IN': '印度', 'RU': '俄罗斯', 'BR': '巴西'
}

const getCountryInfo = (rawRegion) => {
  if (!rawRegion || rawRegion === 'Unknown') return { code: 'UN', name: '未知区域', suffix: '', emoji: '🌐' }
  
  const codeMatch = rawRegion.match(/^[A-Za-z]+/)
  const code = codeMatch ? codeMatch[0].toUpperCase() : 'UN'
  const suffix = rawRegion.substring(code.length).trim()
  
  return {
    code: code,
    name: COUNTRY_MAP[code] || code,
    suffix: suffix,
    emoji: getFlagEmoji(code)
  }
}

const processedServers = computed(() => {
  let list = [...servers.value]
  
  // 1. 基础过滤与搜索
  if (searchQuery.value) {
    const kw = searchQuery.value.toLowerCase()
    list = list.filter(s => (s.name && s.name.toLowerCase().includes(kw)) || (s.region && s.region.toLowerCase().includes(kw)))
  }
  if (filterBy.value === 'online') list = list.filter(s => isOnline(s.last_active))
  if (filterBy.value === 'offline') list = list.filter(s => !isOnline(s.last_active))
  
  // 2. 国家/地区点击筛选逻辑
  if (groupBy.value === 'region' && selectedCountry.value !== 'ALL') {
    list = list.filter(s => {
      const info = getCountryInfo(s.region)
      return info.code === selectedCountry.value
    })
  }
  
  // 3. 排序逻辑
  list.sort((a, b) => {
    const aOnline = isOnline(a.last_active)
    const bOnline = isOnline(b.last_active)
    
    if (aOnline && !bOnline) return -1
    if (!aOnline && bOnline) return 1
    
    if (sortBy.value === 'cpu') return (b.cpu || 0) - (a.cpu || 0)
    if (sortBy.value === 'network') return ((b.net_tx_speed || 0) + (b.net_rx_speed || 0)) - ((a.net_tx_speed || 0) + (a.net_rx_speed || 0))
    
    return 0
  })
  
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

// 提取国家列表供导航栏渲染
const uniqueCountries = computed(() => {
  if (groupBy.value !== 'region') return []
  const countries = new Map()
  
  // 必须基于完整 servers 提取，避免点击后自身消失
  servers.value.forEach(s => {
    if (s.region) {
      const info = getCountryInfo(s.region)
      if (!countries.has(info.code) && info.code !== 'UN') {
        countries.set(info.code, info)
      }
    }
  })
  return Array.from(countries.values())
})

const handleShowDetail = (serverData) => router.push({ name: 'ServerDetail', params: { id: serverData.node_id } })

const handleAdminClick = () => {
  if (authStore.isLoggedIn) { router.push('/admin') } else { isPrivateLogin.value = false; showLogin.value = true }
}

const onLoginSuccess = () => { if (isPrivateLogin.value) serverStore.startPolling(false) }

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
@import '../assets/main.css';

.country-scroll-nav {
  display: flex;
  overflow-x: auto;
  gap: 10px;
  padding: 0 0 0 0;
  margin: 0 auto 0 auto; /* 底部间距隔离重叠 */
  max-width: 1440px;
  width: 100%;
  box-sizing: border-box;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.country-scroll-nav::-webkit-scrollbar {
  display: none;
}

.country-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: var(--surface-color, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 14px;
  cursor: pointer;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-main);
  transition: all 0.2s ease;
  user-select: none;
}
.country-tab:hover {
  border-color: var(--primary-color, #10b981);
  background: rgba(16, 185, 129, 0.05);
}
.country-tab.active {
  border-color: var(--primary-color, #10b981);
  background: rgba(16, 185, 129, 0.1);
  color: var(--primary-color, #10b981);
}
.tab-flag {
  font-size: 14px;
}
</style>