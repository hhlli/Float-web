<template>
  <div class="view-section active">
    <div v-if="isLoading" style="text-align: center; color: var(--text-muted); padding: 40px;">
      正在加载配置信息...
    </div>

    <transition name="fade" mode="out-in" v-else>
      <component 
        :is="activeComponent" 
        :initialData="settingsData"
        @save="handleSave"
      ></component>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, markRaw } from 'vue'
import { useRoute } from 'vue-router' // 🌟 引入路由工具
import request from '../../utils/request.js' 

// 导入子组件
import AccountSettings from './settings/AccountSettings.vue'
import SiteConfig from './settings/SiteConfig.vue'
import NotificationSettings from './settings/NotificationSettings.vue'
import NotifyAlerts from './settings/NotificationRules.vue'

// 🌟 移除 props，改为从路由获取参数
const route = useRoute()

const isLoading = ref(true)
const settingsData = ref({})

// 视图映射表
const componentsMap = {
  account: markRaw(AccountSettings),
  site: markRaw(SiteConfig),
  notification: markRaw(NotificationSettings),
  notify: markRaw(NotifyAlerts)
}

// 🌟 核心逻辑：监听 URL 中的 tab 参数来切换组件
const activeComponent = computed(() => {
  const tab = route.query.tab
  return componentsMap[tab] || componentsMap['account']
})

/**
 * 加载配置信息
 */
const loadSettings = async () => {
  isLoading.value = true
  try {
    const data = await request.get('/api/admin/settings/get')
    // 兼容可能存在的 data 包裹层级
    settingsData.value = data.data ? data.data : data
  } catch(e) { 
    console.error('加载设置失败:', e) 
  } finally {
    isLoading.value = false
  }
}

/**
 * 保存配置修改
 */
const handleSave = async (payload) => {
  // 合并当前缓存 + 新数据，直接发送，不硬编码字段白名单
  const safeData = {}
  const merged = { ...settingsData.value, ...payload }

  // 对所有字段做类型安全转换
  for (const [k, v] of Object.entries(merged)) {
    if (v !== null && v !== undefined) {
      safeData[k] = String(v)
    }
  }

  // 敏感字段不回写缓存（密码等）
  try {
    await request.post('/api/admin/settings/update', safeData)
    const newCache = { ...safeData }
    delete newCache.admin_password
    settingsData.value = newCache
    alert('保存成功')
  } catch(e) {
    console.error('更新失败:', e)
    alert('更新失败，详情请查看控制台日志')
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { 
  transition: opacity 0.2s ease, transform 0.2s ease; 
}
.fade-enter-from, .fade-leave-to { 
  opacity: 0; 
  transform: translateY(10px); 
}

.view-section {
  width: 100%;
}
</style>