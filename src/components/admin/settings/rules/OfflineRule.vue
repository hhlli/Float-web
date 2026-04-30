<template>
  <div class="rule-section">
    <div class="form-row" style="display: flex; align-items: flex-start; justify-content: flex-start; gap: 32px;">
      <div class="form-group" style="margin-bottom: 0;">
        <label style="display: block; font-size: 14px; font-weight: bold; margin-bottom: 12px; color: var(--text-main);">全局离线通知</label>
        <div style="display: flex; gap: 10px; align-items: center; height: 36px;">
          <BaseToggle v-model="globalSettings.notify_offline_enable" />
          <span style="font-size: 14px; color: var(--text-main);">{{ globalSettings.notify_offline_enable ? '已开启通知' : '已关闭通知' }}</span>
        </div>
      </div>
      
      <BaseNumberGroup v-model="globalSettings.offline_threshold" label="判定时间 (秒)" width="150px" min="60" />
      <BaseNumberGroup v-model="globalSettings.offline_cooldown" label="告警冷却 (秒)" width="150px" min="0" />
    </div>

    <div class="server-list" style="margin-top: 16px;">
      <div v-if="servers.length === 0" class="empty-tip">暂无服务器</div>
      <div v-for="s in servers" :key="s.node_id" class="server-row">
        <div class="server-info">
          <span class="status-dot" :class="isOnline(s) ? 'online' : 'offline'"></span>
          <span class="server-name" :title="s.name || s.node_id">{{ s.name || s.node_id }}</span>
        </div>
        <BaseToggle v-model="offlineRules[s.node_id]" />
      </div>
    </div>
    
    <div class="action-row" style="margin-top: 24px;">
      <BaseSaveButton :loading="isSaving" @click="saveData" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import BaseToggle from '../../../common/BaseToggle.vue'
import BaseNumberGroup from '../../../common/BaseNumberGroup.vue'
import BaseSaveButton from '../../../common/BaseSaveButton.vue'

const token = localStorage.getItem('server_token')
const isSaving = ref(false)
const servers = ref([])
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

const fetchServers = async () => {
  try {
    const res = await fetch('/api/admin/servers', { headers: { 'Authorization': 'Bearer ' + token } })
    if (res.ok) {
      const data = await res.json()
      servers.value = data
      data.forEach(s => {
        if (offlineRules.value[s.node_id] === undefined) offlineRules.value[s.node_id] = true
      })
    }
  } catch (e) { console.error(e) }
}

const fetchSettings = async () => {
  try {
    const res = await fetch('/api/admin/settings/get', { headers: { 'Authorization': 'Bearer ' + token } })
    if (res.ok) {
      const data = await res.json()
      if (data.offline_rules) {
        try { offlineRules.value = JSON.parse(data.offline_rules) } catch {}
      }
      globalSettings.value.notify_offline_enable = data.notify_offline_enable === 'true'
      if (data.offline_threshold) globalSettings.value.offline_threshold = parseInt(data.offline_threshold)
      if (data.offline_cooldown) globalSettings.value.offline_cooldown = parseInt(data.offline_cooldown)
    }
  } catch (e) { console.error(e) }
}

const saveData = async () => {
  isSaving.value = true
  try {
    const payload = {
      offline_rules: JSON.stringify(offlineRules.value),
      notify_offline_enable: globalSettings.value.notify_offline_enable ? 'true' : 'false',
      offline_threshold: globalSettings.value.offline_threshold.toString(),
      offline_cooldown: globalSettings.value.offline_cooldown.toString()
    }
    const res = await fetch('/api/admin/settings/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      alert('保存成功')
      await fetchSettings()
    } else { alert('保存失败') }
  } catch (e) { alert('请求出错') }
  isSaving.value = false
}

onMounted(async () => {
  await fetchSettings()
  await fetchServers()
})
</script>

<style scoped>
.form-row { display: flex; margin-bottom: 16px; }

.server-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.empty-tip { color: var(--text-muted); font-size: 14px; padding: 20px 0; grid-column: 1 / -1; text-align: center; }
.server-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 8px; background: var(--card-bg-secondary, rgba(255,255,255,0.03)); border: 1px solid var(--border-color, #3a3a4a); overflow: hidden; }
.server-info { display: flex; align-items: center; gap: 10px; overflow: hidden; white-space: nowrap; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.status-dot.online { background: #2ecc71; }
.status-dot.offline { background: var(--danger, #e74c3c); }
.server-name { font-size: 14px; color: var(--text-main); text-overflow: ellipsis; overflow: hidden; }
</style>