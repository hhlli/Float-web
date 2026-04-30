<template>
  <div class="rule-section">
    
    <div class="form-row" style="display: flex; align-items: flex-start; justify-content: flex-start; gap: 32px; margin-bottom: 24px;">
      <div class="form-group" style="margin-bottom: 0;">
        <label style="display: block; font-size: 14px; font-weight: bold; margin-bottom: 12px; color: var(--text-main);">通知状态</label>
        <div style="display: flex; gap: 10px; align-items: center; height: 36px;">
          <BaseToggle v-model="loadRule.enabled" />
          <span style="font-size: 14px; color: var(--text-main);">{{ loadRule.enabled ? '已启用负载通知' : '已关闭负载通知' }}</span>
        </div>
      </div>
      
      <BaseNumberGroup v-model="loadRule.cpu_threshold" label="CPU 告警阈值 (%)" width="150px" min="0" max="100" placeholder="90" />
      <BaseNumberGroup v-model="loadRule.mem_threshold" label="内存告警阈值 (%)" width="150px" min="0" max="100" placeholder="90" />
      <BaseNumberGroup v-model="loadRule.duration" label="持续时长 (分钟)" width="150px" min="1" placeholder="5" />
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
const loadRule = ref({ enabled: false, cpu_threshold: 90, mem_threshold: 90, duration: 5 })

const fetchSettings = async () => {
  try {
    const res = await fetch('/api/admin/settings/get', { headers: { 'Authorization': 'Bearer ' + token } })
    if (res.ok) {
      const data = await res.json()
      if (data.load_rule) {
        try { loadRule.value = JSON.parse(data.load_rule) } catch {}
      }
    }
  } catch (e) { console.error(e) }
}

const saveData = async () => {
  isSaving.value = true
  try {
    const res = await fetch('/api/admin/settings/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ load_rule: JSON.stringify(loadRule.value) })
    })
    if (res.ok) {
      alert('保存成功')
      await fetchSettings()
    } else { alert('保存失败') }
  } catch (e) { alert('请求出错') }
  isSaving.value = false
}

onMounted(() => fetchSettings())
</script>

<style scoped>
.rule-tip { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; padding: 10px 14px; background: var(--card-bg-secondary, rgba(255,255,255,0.03)); border-radius: 8px; border-left: 3px solid var(--accent, #7c6af7); }
</style>