<template>
  <div class="rule-section">
    <div class="form-row rule-settings-row">
      <div class="form-group toggle-group">
        <label>全局离线通知</label>
        <div class="toggle-wrapper">
          <BaseToggle v-model="globalSettings.notify_offline_enable" />
          <span class="toggle-label">{{ globalSettings.notify_offline_enable ? '已开启通知' : '已关闭通知' }}</span>
        </div>
      </div>
      
      <BaseNumberGroup v-model="globalSettings.offline_threshold" label="判定时间 (秒)" width="150px" min="60" />
      <BaseNumberGroup v-model="globalSettings.offline_cooldown" label="告警冷却 (秒)" width="150px" min="0" />
    </div>

    <div class="server-list">
      <div v-if="servers.length === 0" class="empty-tip">暂无服务器</div>
      <div v-for="s in servers" :key="s.node_id" class="server-row">
        <div class="server-info">
          <span class="status-dot" :class="isOnline(s) ? 'online' : 'offline'"></span>
          <span class="server-name" :title="s.name || s.node_id">{{ s.name || s.node_id }}</span>
        </div>
        <BaseToggle v-model="offlineRules[s.node_id]" />
      </div>
    </div>
    
    <div class="action-row">
      <BaseSaveButton :loading="isSaving" @click="saveData" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '@/utils/request.js'
import { showToast } from '@/utils/toast.js'
import { useServerStore } from '@/store/server.js' // 🌟 引入 Store
import BaseToggle from '@/components/common/BaseToggle.vue'
import BaseNumberGroup from '@/components/common/BaseNumberGroup.vue'
import BaseSaveButton from '@/components/common/BaseSaveButton.vue'

const serverStore = useServerStore()
// 🌟 直接从 Store 中获取响应式的服务器列表
const servers = computed(() => serverStore.servers)

const isSaving = ref(false)
const offlineRules = ref({})

const globalSettings = ref({
  notify_offline_enable: true,
  offline_threshold: 180,
  offline_cooldown: 3600
})

const isOnline = (s) => {
  if (!s.last_active) return false
  const threshold = globalSettings.value.offline_threshold || 180
  return (Date.now() / 1000 - s.last_active) < threshold
}

const fetchSettings = async () => {
  try {
    const data = await request.get('/api/admin/settings/get')
    if (data) {
      if (data.offline_rules) {
        try { offlineRules.value = JSON.parse(data.offline_rules) } catch {}
      }
      globalSettings.value.notify_offline_enable = data.notify_offline_enable === 'true'
      if (data.offline_threshold) globalSettings.value.offline_threshold = parseInt(data.offline_threshold)
      if (data.offline_cooldown) globalSettings.value.offline_cooldown = parseInt(data.offline_cooldown)
      
      // 补充缺失的节点配置
      servers.value.forEach(s => {
        if (offlineRules.value[s.node_id] === undefined) offlineRules.value[s.node_id] = true
      })
    }
  } catch (e) {
    console.error(e)
  }
}

const saveData = async () => {
  isSaving.value = true
  try {
    // 🌟 脏数据清洗逻辑：只保留当前实际存在的节点
    const validIds = new Set(servers.value.map(s => s.node_id))
    const cleanOfflineRules = {}
    for (const key in offlineRules.value) {
      if (validIds.has(key)) {
        cleanOfflineRules[key] = offlineRules.value[key]
      }
    }

    const payload = {
      offline_rules: JSON.stringify(cleanOfflineRules), // 提交干净的数据
      notify_offline_enable: globalSettings.value.notify_offline_enable ? 'true' : 'false',
      offline_threshold: globalSettings.value.offline_threshold.toString(),
      offline_cooldown: globalSettings.value.offline_cooldown.toString()
    }
    await request.post('/api/admin/settings/update', payload)
    showToast('保存成功', 'success')
    await fetchSettings()
  } catch (e) {
    showToast('保存失败', 'error')
    console.error(e)
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  await fetchSettings()
})
</script>

<style scoped>
.rule-settings-row { display: flex; align-items: flex-start; gap: 32px; margin-bottom: 24px; }
.toggle-group { margin-bottom: 0; }
.toggle-group label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 12px; color: var(--text-main); }
.toggle-wrapper { display: flex; gap: 10px; align-items: center; height: 36px; }
.toggle-label { font-size: 14px; color: var(--text-main); }

.server-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 16px; }
.empty-tip { color: var(--text-muted); font-size: 14px; padding: 20px 0; grid-column: 1 / -1; text-align: center; }
.server-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 8px; background: var(--surface-color); border: 1px solid var(--border-color); overflow: hidden; transition: border-color 0.2s; }
.server-row:hover { border-color: var(--primary-color); }
.server-info { display: flex; align-items: center; gap: 10px; overflow: hidden; white-space: nowrap; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.status-dot.online { background: #10b981; }
.status-dot.offline { background: #ef4444; }
.server-name { font-size: 14px; color: var(--text-main); text-overflow: ellipsis; overflow: hidden; }

.action-row {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}
</style>