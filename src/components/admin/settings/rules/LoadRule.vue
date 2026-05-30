<template>
  <div class="rule-section">
    <div class="form-row rule-settings-row">
      <div class="form-group toggle-group">
        <label>全局负载通知</label>
        <div class="toggle-wrapper">
          <BaseToggle v-model="loadRule.enabled" />
          <span class="toggle-label">{{ loadRule.enabled ? '已启用负载通知' : '已关闭负载通知' }}</span>
        </div>
      </div>
      
      <BaseNumberGroup v-model="loadRule.default_cpu_threshold" label="全局 CPU 告警阈值 (%)" width="170px" min="0" max="100" placeholder="90" />
      <BaseNumberGroup v-model="loadRule.default_mem_threshold" label="全局内存告警阈值 (%)" width="170px" min="0" max="100" placeholder="90" />
      <BaseNumberGroup v-model="loadRule.default_duration" label="全局持续时长 (分钟)" width="150px" min="1" placeholder="5" />
    </div>

    <div class="server-list">
      <div v-if="servers.length === 0" class="empty-tip">暂无服务器</div>
      <div v-for="s in servers" :key="s.node_id" class="server-row">
        <div class="server-info">
          <span class="status-dot" :class="isOnline(s) ? 'online' : 'offline'"></span>
          <span class="server-name" :title="s.name || s.node_id">{{ s.name || s.node_id }}</span>
        </div>
        <div class="override-inputs">
          <div class="override-input-group">
            <span class="input-prefix">CPU</span>
            <input 
              type="number" 
              class="small-input"
              v-model.number="loadRule.cpu_overrides[s.node_id]" 
              :placeholder="loadRule.default_cpu_threshold || 90"
              min="0" 
              max="100"
            >
          </div>
          <div class="override-input-group">
            <span class="input-prefix">内存</span>
            <input 
              type="number" 
              class="small-input"
              v-model.number="loadRule.mem_overrides[s.node_id]" 
              :placeholder="loadRule.default_mem_threshold || 90"
              min="0" 
              max="100"
            >
          </div>
        </div>
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
// 🌟 统一使用 Store，消灭组件内的冗余 HTTP 请求
const servers = computed(() => serverStore.servers)

const isSaving = ref(false)
const loadRule = ref({ 
  enabled: false, 
  default_cpu_threshold: 90, 
  default_mem_threshold: 90, 
  default_duration: 5,
  cpu_overrides: {},
  mem_overrides: {}
})

const isOnline = (s) => s.last_active && (Date.now() / 1000 - s.last_active) < 60

const fetchSettings = async () => {
  try {
    const data = await request.get('/api/admin/settings/get')
    if (data && data.load_rule) {
      try { 
        const parsed = JSON.parse(data.load_rule)
        loadRule.value = {
          enabled: parsed.enabled || false,
          default_cpu_threshold: parsed.default_cpu_threshold || parsed.cpu_threshold || 90,
          default_mem_threshold: parsed.default_mem_threshold || parsed.mem_threshold || 90,
          default_duration: parsed.default_duration || parsed.duration || 5,
          cpu_overrides: parsed.cpu_overrides || {},
          mem_overrides: parsed.mem_overrides || {}
        }
      } catch {}
    }
  } catch (e) {
    console.error(e)
  }
}

const saveData = async () => {
  isSaving.value = true
  
  // 🌟 脏数据清洗机制：获取所有真实节点ID
  const validIds = new Set(servers.value.map(s => s.node_id))

  const cleanCpuOverrides = {}
  for (const key in loadRule.value.cpu_overrides) {
    const val = loadRule.value.cpu_overrides[key]
    // 只有真实存在的节点才会保存进去
    if (validIds.has(key) && val !== '' && val !== null && val !== undefined) {
      cleanCpuOverrides[key] = Number(val)
    }
  }

  const cleanMemOverrides = {}
  for (const key in loadRule.value.mem_overrides) {
    const val = loadRule.value.mem_overrides[key]
    if (validIds.has(key) && val !== '' && val !== null && val !== undefined) {
      cleanMemOverrides[key] = Number(val)
    }
  }
  
  const payload = {
    enabled: loadRule.value.enabled,
    default_cpu_threshold: Number(loadRule.value.default_cpu_threshold) || 90,
    default_mem_threshold: Number(loadRule.value.default_mem_threshold) || 90,
    default_duration: Number(loadRule.value.default_duration) || 5,
    cpu_overrides: cleanCpuOverrides,
    mem_overrides: cleanMemOverrides
  }

  try {
    await request.post('/api/admin/settings/update', { 
      load_rule: JSON.stringify(payload) 
    })
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
.server-info { display: flex; align-items: center; gap: 10px; overflow: hidden; white-space: nowrap; flex: 1; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.status-dot.online { background: #10b981; }
.status-dot.offline { background: #ef4444; }
.server-name { font-size: 14px; color: var(--text-main); text-overflow: ellipsis; overflow: hidden; }

.override-inputs { display: flex; gap: 12px; }
.override-input-group { display: flex; align-items: center; gap: 6px; }
.input-prefix { font-size: 12px; color: var(--text-muted); }
.small-input { width: 52px; padding: 4px 6px; font-size: 12px; border-radius: 4px; border: 1px solid var(--border-color); background: transparent; color: var(--text-main); text-align: center; outline: none; transition: border-color 0.2s; }
.small-input:focus { border-color: var(--primary-color); }
.small-input::placeholder { color: var(--text-muted); opacity: 0.6; }
.small-input::-webkit-outer-spin-button, .small-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.small-input[type=number] { -moz-appearance: textfield; }

.action-row {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

/* 响应式断点调整，避免双输入框挤压 */
@media (max-width: 1400px) {
  .server-list { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 900px) {
  .server-list { grid-template-columns: 1fr; }
}
</style>