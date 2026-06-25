<template>
  <div class="view-section active">
    <div class="card">
      <div class="card-body">
        <div class="flex-header" style="margin-bottom: 24px;">
          <h3 class="section-title" style="margin-bottom: 0;">通用插件运行终端 ({{ extId }})</h3>
          <button class="btn-outline" title="返回上一页" @click="goBack" :disabled="isRunning" style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; padding: 0; border-radius: 6px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
        </div>

        <div class="form-container" style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end; margin-bottom: 32px;">
          <div class="form-group" style="flex: 1; min-width: 200px; margin-bottom: 0;">
            <label>执行节点</label>
            <select v-model="form.node_id" class="form-control" :disabled="isRunning">
              <option value="" disabled>请选择在线节点...</option>
              <option v-for="s in onlineServers" :key="s.node_id" :value="s.node_id">
                {{ s.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group" style="flex: 2; min-width: 300px; margin-bottom: 0;">
            <label>执行参数 (按空格分隔，例如: -target 8.8.8.8 -port 80)</label>
            <input 
              type="text" 
              v-model="form.argsInput" 
              class="form-control" 
              placeholder="输入传递给插件的参数..." 
              :disabled="isRunning" 
            />
          </div>

          <div style="flex-shrink: 0; margin-bottom: 0;">
            <button class="btn-primary" style="padding: 8px 24px; height: 37px;" @click="startExecution" :disabled="isRunning || !form.node_id">
              {{ isRunning ? '执行中...' : '发送指令' }}
            </button>
          </div>
        </div>

        <div v-if="statusText || rawOutput" class="result-section">
          <div class="divider"></div>
          <h4 class="inner-title">输出结果</h4>
          <div v-if="statusText" class="status-bar" :class="{'running': isRunning}">
            {{ statusText }}
          </div>
          <div v-if="rawOutput" class="output-console">
            <pre>{{ rawOutput }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/utils/request.js'
import { useServerStore } from '@/store/server.js'

const props = defineProps({ extId: String })
const route = useRoute()
const router = useRouter()
const serverStore = useServerStore()

const form = ref({ node_id: '', argsInput: '' })
const isRunning = ref(false)
const statusText = ref('')
const rawOutput = ref('')
let pollInterval = null
let currentTaskId = null

const installedNodes = computed(() => route.query.nodes ? route.query.nodes.split(',') : [])
const onlineServers = computed(() => {
  const installedSet = new Set(installedNodes.value)
  return serverStore.servers.filter(s => (Date.now() / 1000 - s.last_active < 180) && installedSet.has(s.node_id))
})

const goBack = () => { if (!isRunning.value) router.back() }

onMounted(() => {
  if (serverStore.servers.length === 0) serverStore.fetchStaticServers()
  if (onlineServers.value.length > 0) form.value.node_id = onlineServers.value[0].node_id
})

onUnmounted(() => { if (pollInterval) clearInterval(pollInterval) })

const startExecution = async () => {
  if (!form.value.node_id) return
  isRunning.value = true
  rawOutput.value = ''
  statusText.value = '指令下发中...'
  const argsArray = form.value.argsInput.trim().split(/\s+/).filter(Boolean)
  
  try {
    const res = await request.post('/api/admin/plugin/execute', { 
      node_id: form.value.node_id, 
      ext_id: props.extId,
      args: argsArray 
    })
    const payload = res.data || res
    currentTaskId = payload.task_id
    statusText.value = '执行中，等待探针回传结果...'
    startPolling()
  } catch (err) {
    statusText.value = '指令下发失败。'
    isRunning.value = false
  }
}

const startPolling = () => {
  if (pollInterval) clearInterval(pollInterval)
  pollInterval = setInterval(async () => {
    try {
      const res = await request.get('/api/admin/plugin/result', {
        params: { node_id: form.value.node_id, ext_id: props.extId, task_id: currentTaskId, _t: Date.now() }
      })
      const payload = res.data?.status ? res.data : res
      
      if (payload && payload.status === 'success' && payload.data) {
        isRunning.value = false
        clearInterval(pollInterval)
        statusText.value = '执行完成'
        if (payload.data.error) {
          rawOutput.value = `[执行报错]\n${payload.data.error}`
        } else if (payload.data.raw_output) {
          rawOutput.value = payload.data.raw_output
        } else {
          rawOutput.value = JSON.stringify(payload.data, null, 2)
        }
      }
    } catch (err) {
      clearInterval(pollInterval)
      isRunning.value = false
      statusText.value = '获取结果超时。'
    }
  }, 3000)
}
</script>

<style scoped>
/* 继承通用样式 */
.view-section { width: 100%; }
.flex-header { display: flex; justify-content: space-between; align-items: center; }
.inner-title { font-size: 15px; font-weight: 500; color: var(--text-main); margin-top: 0; margin-bottom: 16px; }
.divider { height: 1px; background-color: var(--border-color); margin-bottom: 24px; }
.form-group { margin-bottom: 16px; display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 13px; color: var(--text-main); font-weight: 500; }
.form-control { width: 100%; padding: 8px 10px; border: 1px solid var(--border-color); border-radius: 6px; background-color: var(--surface-color, #ffffff); color: var(--text-main); font-size: 14px; font-family: inherit; box-sizing: border-box; outline: none; transition: all 0.2s; }
.form-control:focus { border-color: var(--primary-color, #10b981); box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15); }
.form-control:disabled { background-color: rgba(0, 0, 0, 0.03); cursor: not-allowed; }
.status-bar { padding: 12px; background: var(--bg-color); border-radius: 6px; color: var(--text-muted); font-size: 13px; text-align: center; margin-bottom: 16px; }
.status-bar.running { color: var(--primary-color, #059669); background: #d1fae5; animation: pulse 2s infinite; }
.output-console { background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 6px; overflow-x: auto; font-family: monospace; font-size: 13px; line-height: 1.5; }
.output-console pre { margin: 0; white-space: pre-wrap; word-wrap: break-word; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
</style>