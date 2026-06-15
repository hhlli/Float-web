<template>
  <div class="rule-section">
    <div class="form-row rule-settings-row">
      <div class="form-group toggle-group">
        <label>全局流量通知</label>
        <div class="toggle-wrapper">
          <BaseToggle v-model="trafficRule.enabled" />
          <span class="toggle-label">{{ trafficRule.enabled ? '已启用流量通知' : '已关闭流量通知' }}</span>
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
        <div class="override-input-group">
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

    <div class="action-row">
      <BaseSaveButton :loading="isSaving" @click="saveData" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watchEffect } from 'vue'
import { showToast } from '@/utils/toast.js'
import { useServerStore } from '@/store/server.js'
import { useSettingsStore } from '@/store/settings.js'
import BaseToggle from '@/components/common/BaseToggle.vue'
import BaseNumberGroup from '@/components/common/BaseNumberGroup.vue'
import BaseSaveButton from '@/components/common/BaseSaveButton.vue'

const serverStore = useServerStore()
const servers = computed(() => serverStore.servers)

const settingsStore = useSettingsStore()
const isSaving = ref(false)
const trafficRule = ref({ enabled: false, default_threshold: 80, overrides: {} })

const isOnline = (s) => s.last_active && (Date.now() / 1000 - s.last_active) < 60

watchEffect(() => {
  const data = settingsStore.config
  if (data && data.traffic_rule) {
    try { 
      const parsed = JSON.parse(data.traffic_rule)
      trafficRule.value = {
        enabled: parsed.enabled || false,
        default_threshold: parsed.default_threshold || parsed.threshold || 80,
        overrides: parsed.overrides || {}
      }
    } catch {}
  }
})

const saveData = async () => {
  isSaving.value = true
  const validIds = new Set(servers.value.map(s => s.node_id))
  const cleanOverrides = {}
  
  for (const key in trafficRule.value.overrides) {
    const val = trafficRule.value.overrides[key]
    if (validIds.has(key) && val !== '' && val !== null && val !== undefined) {
      cleanOverrides[key] = Number(val)
    }
  }
  
  const payload = {
    enabled: trafficRule.value.enabled,
    default_threshold: Number(trafficRule.value.default_threshold) || 80,
    overrides: cleanOverrides
  }

  try {
    await settingsStore.updateSettings({ 
      traffic_rule: JSON.stringify(payload) 
    })
    showToast('保存成功', 'success')
  } catch (e) {
    showToast('保存失败', 'error')
    console.error(e)
  } finally {
    isSaving.value = false
  }
}
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

.override-input-group { display: flex; align-items: center; gap: 6px; }
.text-muted { color: var(--text-muted); }
.small-input { width: 68px; padding: 4px 6px; font-size: 12px; border-radius: 4px; border: 1px solid var(--border-color); background: transparent; color: var(--text-main); text-align: center; outline: none; transition: border-color 0.2s; }
.small-input:focus { border-color: var(--primary-color); }
.small-input::placeholder { color: var(--text-muted); opacity: 0.6; }
.small-input::-webkit-outer-spin-button, .small-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.small-input[type=number] { -moz-appearance: textfield; }

.action-row {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}
</style>