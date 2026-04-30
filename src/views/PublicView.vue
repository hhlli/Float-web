<template>
  <div id="public-layout" style="padding: 16px; display: flex; flex-direction: column; gap: 16px; min-height: 100vh;">
    <PublicHeader
      :siteName="siteSettings.site_name"
      :siteDesc="siteSettings.site_desc"
      @open-login="showLogin = true"
    />

    <!-- 工具栏 -->
    <div class="toolbar-bar">
      <div class="toolbar-left">
        <span class="server-count">{{ servers.length }} 台服务器</span>
      </div>
      <div class="toolbar-right">
        <BaseSelect
          v-model="cardStyle"
          :options="selectOptions"
        />
      </div>
    </div>

    <main class="public-container" style="max-width: 1440px; width: 100%; margin: 0 auto; padding: 0;">
      <div v-if="servers.length === 0" class="empty-state" style="text-align: center; padding: 60px;">
        暂无公开展示的节点或正在加载...
      </div>

      <template v-else-if="currentStyleConfig?.isGlobal">
        <component
          :is="currentStyleConfig.component"
          :servers="servers"
          @show-detail="handleShowDetail"
        />
      </template>

      <div v-else class="server-grid">
        <component
          :is="currentStyleConfig.component"
          v-for="s in servers"
          :key="s.node_id"
          :server="s"
          @show-detail="handleShowDetail"
        />
      </div>
    </main>

    <LoginModal
      :show="showLogin"
      @close="showLogin = false"
    />

    <footer
      class="public-footer"
      v-if="siteSettings.custom_footer"
      v-html="siteSettings.custom_footer"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request.js'
import PublicHeader from '../components/public/PublicHeader.vue'
import LoginModal   from '../components/public/LoginModal.vue'
import BaseSelect   from '../components/common/BaseSelect.vue'
import { cardStyles } from '../components/public/card-styles/index.js'

const router       = useRouter()
const servers      = ref([])
const showLogin    = ref(false)
const siteSettings = ref({})
const cardStyle    = ref(localStorage.getItem('cardStyle') || 'default')

// 传给 BaseSelect 的选项（去掉 component 字段）
const selectOptions = cardStyles.map(({ value, label, desc }) => ({ value, label, desc }))

// 当前选中的卡片组件
// 替换原有的 currentComponent
const currentStyleConfig = computed(() =>
  cardStyles.find(o => o.value === cardStyle.value) || cardStyles[0]
)

// 持久化用户偏好
watch(cardStyle, val => localStorage.setItem('cardStyle', val))

const handleShowDetail = (serverData) => {
  router.push({ name: 'ServerDetail', params: { id: serverData.node_id } })
}

const loadPublicSettings = async () => {
  try {
    const data = await request.get('/api/public/settings')
    siteSettings.value = data || {}
    if (data?.site_name) document.title = data.site_name
  } catch (e) {
    console.error('无法获取站点配置')
  }
}

const loadPublicData = async () => {
  try {
    const data = await request.get('/api/public/servers')
    servers.value = data || []
  } catch (e) {
    console.error('无法连接到后端接口')
  }
}

let fetchTimer = null
onMounted(() => {
  loadPublicSettings()
  loadPublicData()
  fetchTimer = setInterval(loadPublicData, 5000)
})
onUnmounted(() => {
  if (fetchTimer) clearInterval(fetchTimer)
})
</script>

<style scoped>
.toolbar-bar {
  max-width: 1440px; width: 100%; margin: 0 auto;
  min-height: 52px;
  background: var(--surface-color, #fff);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px; box-sizing: border-box;
}
.toolbar-left  { display: flex; align-items: center; }
.toolbar-right { display: flex; align-items: center; }
.server-count  { font-size: 13px; color: var(--text-muted, #94a3b8); font-weight: 500; }

.server-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
.empty-state { grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-muted); font-size: 15px; }
.public-footer { text-align: center; padding: 20px 0; color: var(--text-muted); font-size: 14px; margin-top: auto; }
</style>