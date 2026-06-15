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
import { useRoute } from 'vue-router'
import request from '@/utils/request.js' 
import { showToast } from '@/utils/toast.js'
import SessionSettings from './settings/SessionSettings.vue'
import IntegrationSettings from './settings/IntegrationSettings.vue' // 新增引入

// 导入子组件
import AccountSettings from './settings/AccountSettings.vue'
import SiteConfig from './settings/SiteConfig.vue'
import NotificationSettings from './settings/NotificationSettings.vue'
import NotifyAlerts from './settings/NotificationRules.vue'
import GeneralSettings from './settings/GeneralSettings.vue' 

const route = useRoute()

const isLoading = ref(true)
const settingsData = ref({})

// 视图映射表
const componentsMap = {
  account: markRaw(AccountSettings),
  site: markRaw(SiteConfig),
  notification: markRaw(NotificationSettings),
  notify: markRaw(NotifyAlerts),
  general: markRaw(GeneralSettings), // 新增此行
  session: markRaw(SessionSettings),// 新增此行
  integration: markRaw(IntegrationSettings) // 新增映射
}

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
  const safeData = {}
  const merged = { ...settingsData.value, ...payload }

  for (const [k, v] of Object.entries(merged)) {
    if (v !== null && v !== undefined) {
      safeData[k] = String(v)
    }
  }

  try {
    await request.post('/api/admin/settings/update', safeData)
    const newCache = { ...safeData }
    delete newCache.admin_password
    settingsData.value = newCache
    
    // 使用全局统一提示
    showToast('保存成功', 'success')
  } catch(e) {
    console.error('更新失败:', e)
    // 使用全局统一提示
    showToast('更新失败，详情请查看控制台日志', 'error')
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.view-section {
  width: 100%;
}
</style>