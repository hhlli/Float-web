<template>
  <div class="rule-section">
    
    <div class="form-row" style="display: flex; align-items: flex-start; justify-content: flex-start; gap: 32px; margin-bottom: 24px;">
      <div class="form-group" style="margin-bottom: 0;">
        <label style="display: block; font-size: 14px; font-weight: bold; margin-bottom: 12px; color: var(--text-main);">全局流量通知</label>
        <div style="display: flex; gap: 10px; align-items: center; height: 36px;">
          <BaseToggle v-model="trafficRule.enabled" />
          <span style="font-size: 14px; color: var(--text-main);">{{ trafficRule.enabled ? '已启用流量通知' : '已关闭流量通知' }}</span>
        </div>
      </div>
      
      <BaseNumberGroup v-model="trafficRule.default_threshold" label="全局默认告警阈值 (%)" width="200px" min="1" max="100" placeholder="80" />
    </div>

    <div class="server-list">
      <div v-if="servers.length === 0" class="empty-tip">暂无服务器</div>
      <div v-for="s in servers" :key="s.node_id" class="server-row">
        <div class="server-info">
          <span class="status-dot" :class="isOnline(s) ? 'online' : 'offline'"></span>
          <span class="server-name" :title="s.name || s.node_id">{{ s.name || s.node_id }}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <input 
            type="number" 
            class="small-input"
            v-model.number="trafficRule.overrides[s.node_id]" 
            :placeholder="'默认 ' + (trafficRule.default_threshold || 80)"
            min="1" 
            max="100"
          >
          <span class="text-muted" style="font-size: 12px;">%</span>
        </div>
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
const trafficRule = ref({ enabled: false, default_threshold: 80, overrides: {} })

const isOnline = (s) => s.last_active && (Date.now() / 1000 - s.last_active) < 60

const fetchServers = async () => {
  try {
    const res = await fetch('/api/admin/servers', { headers: { 'Authorization': 'Bearer ' + token } })
    if (res.ok) servers.value = await res.json()
  } catch (e) { console.error(e) }
}

const fetchSettings = async () => {
  try {
    const res = await fetch('/api/admin/settings/get', { headers: { 'Authorization': 'Bearer ' + token } })
    if (res.ok) {
      const data = await res.json()
      if (data.traffic_rule) {
        try { 
          const parsed = JSON.parse(data.traffic_rule)
          trafficRule.value = {
            enabled: parsed.enabled || false,
            default_threshold: parsed.default_threshold || parsed.threshold || 80,
            overrides: parsed.overrides || {}
          }
        } catch {}
      }
    }
  } catch (e) { console.error(e) }
}

const saveData = async () => {
  isSaving.value = true
  
  const cleanOverrides = {}
  for (const key in trafficRule.value.overrides) {
    const val = trafficRule.value.overrides[key]
    if (val !== '' && val !== null && val !== undefined) cleanOverrides[key] = Number(val)
  }
  
  const payload = {
    enabled: trafficRule.value.enabled,
    default_threshold: Number(trafficRule.value.default_threshold) || 80,
    overrides: cleanOverrides
  }

  try {
    const res = await fetch('/api/admin/settings/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ traffic_rule: JSON.stringify(payload) })
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
.rule-tip { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; padding: 10px 14px; background: var(--card-bg-secondary, rgba(255,255,255,0.03)); border-radius: 8px; border-left: 3px solid var(--accent, #7c6af7); }

.server-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.empty-tip { color: var(--text-muted); font-size: 14px; padding: 20px 0; grid-column: 1 / -1; text-align: center; }
.server-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 8px; background: var(--card-bg-secondary, rgba(255,255,255,0.03)); border: 1px solid var(--border-color, #3a3a4a); overflow: hidden; }
.server-info { display: flex; align-items: center; gap: 10px; overflow: hidden; white-space: nowrap; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.status-dot.online { background: #2ecc71; }
.status-dot.offline { background: var(--danger, #e74c3c); }
.server-name { font-size: 14px; color: var(--text-main); text-overflow: ellipsis; overflow: hidden; }
.text-muted { color: var(--text-muted); }

.small-input { width: 68px; padding: 4px 6px; font-size: 12px; border-radius: 4px; border: 1px solid var(--border-color, #3a3a4a); background: transparent; color: var(--text-main); text-align: center; outline: none; transition: border-color 0.2s; }
.small-input:focus { border-color: var(--accent, #7c6af7); }
.small-input::placeholder { color: var(--text-muted); opacity: 0.6; }
.small-input::-webkit-outer-spin-button, .small-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.small-input[type=number] { -moz-appearance: textfield; }
</style>