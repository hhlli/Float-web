<template>
  <div class="world-map-container">
    <div class="map-wrap" :class="{ 'panel-open': showList }">
      <WorldMap
        :servers="serverStore.servers"
        :server-lat="serverLat"
        :server-lon="serverLon"
        :online-threshold="OFFLINE_THRESHOLD"
        @select-server="handleMapClick"
      />
    </div>

    <MatrixOverlay
      :site-name="siteStore?.settings?.site_name || 'FLOAT MONITOR'"
      :online-count="onlineCount"
      :offline-count="offlineCount"
      :is-open="showList"
      @open-admin="handleAdminClick"
      @toggle-list="showList = true" 
    />

    <Transition name="panel-slide">
      <ServerListPanel
        v-show="showList"
        :servers="serverStore.servers"
        :online-threshold="OFFLINE_THRESHOLD"
        :selected-node-id="focusNodeId"
        @close="showList = false"
        @select="handleSelectServer" />
    </Transition>

    <LoginModal
      :show="showLogin"
      title="SYSTEM_ACCESS"
      subtitle="请输入管理密钥以进入控制台"
      @close="showLogin = false"
      @success="onLoginSuccess"
    />

    <Transition name="modal-fade">
      <div v-if="showDetailModal && selectedServer" class="matrix-modal-overlay" :class="{ 'panel-open': showList }" @click="showDetailModal = false">
        <div class="matrix-modal-container" @click.stop>
          <div class="matrix-modal-header">
        <span class="matrix-modal-title">// SERVER_SPECIFICATION: {{ selectedServer.name }}</span>
        
        <div class="matrix-modal-controls">
          <MatrixTerminalTabs 
            v-model="detailActiveTab" 
            :options="[
              { label: '概览', value: 'overview' },
              { label: '负载', value: 'load' },
              { label: '延迟', value: 'latency' }
            ]"
          />
          
          <div class="matrix-modal-divider"></div>

          <button class="matrix-modal-close" @click="showDetailModal = false">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <div class="matrix-modal-body">
        <MatrixServerDetail 
          :server="selectedServer" 
          :active-tab="detailActiveTab"
        />
      </div>
    </div>
  </div>
</Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useServerStore } from '@/store/server'
import { useSiteStore } from '@/store/site'
import { useAuthStore } from '@/store/auth'
import request from '@/utils/request'
import MatrixTerminalTabs from '@/themes/matrix/components/server-detail/widgets/MatrixTerminalTabs.vue'
import '@/themes/matrix/echarts-theme.js'

import WorldMap from '../components/WorldMap.vue'
import MatrixOverlay from '../components/MatrixOverlay.vue'
import ServerListPanel from '../components/ServerListPanel.vue'
import LoginModal from '../components/LoginModal.vue'
// 🌟 新增：引入详情页组件
import MatrixServerDetail from '../components/server-detail/MatrixServerDetail.vue'

const router = useRouter()
const authStore = useAuthStore()
const serverStore = useServerStore()
const siteStore = useSiteStore()

const mapEngine = ref('leaflet')
const showLogin = ref(false)
const showList = ref(false)
const focusNodeId = ref(null)

// 🌟 新增：控制弹窗状态变量
const showDetailModal = ref(false)
const selectedServer = ref(null)

const OFFLINE_THRESHOLD = 180

const serverLat = computed(() => parseFloat(siteStore.settings?.server_lat || '0.0'))
const serverLon = computed(() => parseFloat(siteStore.settings?.server_lon || '0.0'))

const isOnline = (s) => {
  if (!s.last_active) return false
  return (Date.now() / 1000 - s.last_active) < OFFLINE_THRESHOLD
}

const onlineCount = computed(() => serverStore.servers.filter(isOnline).length)
const offlineCount = computed(() => serverStore.servers.length - onlineCount.value)

const handleMapClick = (server) => {
  showList.value = true 
  focusNodeId.value = null
  nextTick(() => {
    focusNodeId.value = server.node_id
  })
}

// 🌟 新增：处理打开弹窗事件函数
const handleSelectServer = (server) => {
  selectedServer.value = server
  showDetailModal.value = true
}

const handleAdminClick = () => {
  if (authStore.isLoggedIn) {
    router.push('/admin')
  } else {
    showLogin.value = true
  }
}

const onLoginSuccess = () => {
  showLogin.value = false
  router.push('/admin')
}

onMounted(async () => {
  await serverStore.startPolling(false)

  try {
    const geoData = await request.get('/api/public/servers/geo') || []
    geoData.forEach(geo => {
      const target = serverStore.servers.find(s => s.node_id === geo.node_id)
      if (target) {
        target.latitude = geo.latitude
        target.longitude = geo.longitude
      }
    })
  } catch (e) {
    console.error('Fetch geo data error:', e)
  }
})

onUnmounted(() => {
  serverStore.stopPolling()
})
const detailActiveTab = ref('overview') // 🌟 新增状态控制
</script>

<style scoped>
.world-map-container { position: relative; width: 100%; height: 100vh; background: #020d1a; overflow: hidden; display: flex; }

.map-wrap { 
  position: relative; 
  width: 100%; 
  height: 100%; 
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
  z-index: 1; 
}

.map-wrap.panel-open { 
  /* 侧边栏宽 320px，将地图整体向右平移 160px，保持地图中心点在剩余可视区域的居中位置 */
  transform: translateX(160px); 
}

.panel-slide-enter-active, .panel-slide-leave-active { transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease; }
.panel-slide-enter-from, .panel-slide-leave-to { transform: translateX(-100%); opacity: 0; }

/* ================= 替换为以下完全自适应右侧的弹窗样式 ================= */
.matrix-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;                     /* 🌟 默认：从屏幕最左侧开始 */
  right: 0;
  bottom: 0;
  background: rgba(1, 8, 16, 0.3);
  backdrop-filter: none;
  padding: 60px 24px;
  display: flex;
  align-items: center;         /* 🌟 默认：纵向居中 */
  justify-content: center;     /* 🌟 默认：横向居中 */
  z-index: 100;
  box-sizing: border-box;
  transition: left 0.5s cubic-bezier(0.4, 0, 0.2, 1); /* 与地图缩进动画保持同频同速 */
}

.matrix-modal-overlay.panel-open {
  left: 320px;
  align-items: stretch;
  justify-content: stretch;
}

.matrix-modal-container {
  width: 100%;
  height: 100%;
  /* 🌟 限制最大宽度，防止列表收回全屏时容器横向拉伸过度 */
  max-width: 1200px; 
  background: #010810;
  border: 1px solid #00ff8833;
  box-shadow: 0 0 40px rgba(0, 255, 136, 0.06), inset 0 0 24px rgba(0, 255, 136, 0.02);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: max-width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.matrix-modal-overlay.panel-open .matrix-modal-container {
  max-width: 100%;
}

.matrix-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: rgba(0, 255, 136, 0.01);
  border-bottom: 1px solid #00ff8815;
}
.matrix-modal-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.matrix-modal-divider {
  width: 1px;
  height: 14px;
  background: #00ff8822;
}

.matrix-modal-title {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  font-weight: 700;
  color: #00ff88;
  letter-spacing: 0.05em;
}

.matrix-modal-close {
  background: transparent;
  border: 1px solid #00ff8822;
  color: #3a7a55;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.matrix-modal-close:hover {
  border-color: #ff4455;
  color: #ff4455;
  box-shadow: 0 0 8px rgba(255, 68, 85, 0.3);
}

.matrix-modal-body {
  flex: 1;
  overflow-y: auto;
}

/* 进出过渡动画调整 */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .matrix-modal-container {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-fade-leave-active .matrix-modal-container {
  transition: transform 0.2s ease;
}
.modal-fade-enter-from .matrix-modal-container {
  transform: scale(0.99) translateX(10px); /* 顺滑的右侧滑入感 */
}
.modal-fade-leave-to .matrix-modal-container {
  transform: scale(0.99);
}

/* 移动端覆盖逻辑保持一致 */
@media (max-width: 768px) {
  .map-wrap.panel-open { 
    width: 100%;
    height: 45vh; 
    transform: none; /* 重置 PC 端的横向平移 */
  }
  .panel-slide-enter-from, .panel-slide-leave-to { 
    transform: translateY(100%); 
    opacity: 0; 
  }
  
  .matrix-modal-overlay,
  .matrix-modal-overlay.panel-open {
    left: 0;
    padding: 0; /* 移动端去除多余留白 */
    align-items: flex-end; /* 弹窗贴底显示 */
    z-index: 50; /* 确保盖住 z-index 为 30 的列表面板 */
  }
  
  /* 移动端弹窗尺寸优化 */
  .matrix-modal-container { 
    width: 100%; 
    height: 85vh; /* 给予详情页更充裕的高度 */
    border-radius: 12px 12px 0 0; /* 顶部圆角，更像原生 App */
    border-bottom: none;
  }
}
</style>