<template>
  <div class="view-section active">
    
    <div class="card">
      <div class="card-body">
        
        <div class="flex-header" style="margin-bottom: 24px;">
          <h3 class="section-title" style="margin-bottom: 0;">MTR 路由诊断</h3>
          <button class="btn-outline" title="返回上一页" @click="goBack" :disabled="isRunning" style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; padding: 0; border-radius: 6px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
        </div>

        <div class="form-container" style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end; margin-bottom: 32px;">
          
          <div class="form-group" style="flex: 1; min-width: 200px; margin-bottom: 0;">
            <label>起点服务器 (探针)</label>
            <select v-model="form.node_id" class="form-control" :disabled="isRunning">
              <option value="" disabled>请选择在线节点...</option>
              <option v-for="s in onlineServers" :key="s.node_id" :value="s.node_id">
                {{ s.name }} ({{ s.region || '未知' }})
              </option>
            </select>
          </div>

          <div class="form-group" style="flex: 1; min-width: 200px; margin-bottom: 0;">
            <label>目标地址 (快捷选择)</label>
            <select v-model="form.target_select" class="form-control" :disabled="isRunning" @change="onSelectTarget">
             <option value="">-- 手动输入新地址 --</option>
             <option v-for="t in targetOptions" :key="t.target" :value="t.target">{{ t.name }}</option>
            </select>
          </div>
          
          <div class="form-group" style="flex: 1; min-width: 200px; margin-bottom: 0;">
            <label>目标地址 (手动输入)</label>
            <input 
              type="text" 
              v-model="form.target_manual" 
              class="form-control" 
              placeholder="输入 IP 或域名" 
              :disabled="isRunning" 
              @input="onManualInput" 
            />
          </div>

          <div style="flex-shrink: 0; margin-bottom: 0;">
            <button class="btn-primary" style="padding: 8px 24px; white-space: nowrap; height: 37px;" @click="startDiagnostics" :disabled="isRunning || !form.node_id || !finalTarget">
              {{ isRunning ? '诊断中...' : '开始诊断' }}
            </button>
          </div>
        </div>

        <div v-if="form.node_id" class="history-section" style="max-width: 800px; margin-bottom: 32px;">
          <h4 class="inner-title">历史记录 (最近 5 次)</h4>
          <div class="table-responsive" style="border: 1px solid var(--border-color); border-radius: 6px;">
            <table class="mtr-table" style="border: none; margin: 0;">
              <thead>
                <tr>
                  <th style="width: 180px;">诊断时间</th>
                  <th>目标地址</th>
                  <th style="width: 100px; text-align: right;">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="historyData.length === 0">
                  <td colspan="3" style="text-align: center; padding: 24px 0; color: var(--text-muted);">暂无历史记录</td>
                </tr>
                <tr v-for="item in historyData" :key="item.id">
                  <td style="color: var(--text-muted);">{{ formatTime(item.timestamp) }}</td>
                  <td style="font-weight: 500;">{{ item.target }}</td>
                  <td style="text-align: right;">
                    <button class="btn-outline" style="padding: 4px 12px; font-size: 12px;" @click="viewHistoryRecord(item)" :disabled="isRunning">
                      查看详情
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="statusText || (resultData && resultData.length > 0)" class="result-section">
          <div class="divider"></div>
          <h4 class="inner-title">诊断详情</h4>
          
          <div v-if="statusText" class="mtr-status-bar" :class="{'running': isRunning}">
            {{ statusText }}
          </div>

          <div class="table-responsive" v-if="resultData && resultData.length > 0">
            <table class="mtr-table">
              <thead>
                <tr>
                  <th style="width: 50px; text-align: center;">跳数</th>
                  <th>路由节点 (Host)</th>
                  <th style="text-align: right;">丢包率</th>
                  <th style="text-align: right;">已发包</th>
                  <th style="text-align: right;">平均延迟</th>
                  <th style="text-align: right;">最差延迟</th>
                  <th style="text-align: right;">抖动</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="hop in resultData" :key="hop.count">
                  <td style="text-align: center;">{{ hop.count }}</td>
                  <td style="font-family: monospace;">{{ hop.host }}</td>
                  <td style="text-align: right;" :class="{'high-loss': hop.loss > 0}">{{ hop.loss }}%</td>
                  <td style="text-align: right;">{{ hop.snt }}</td>
                  <td style="text-align: right;">{{ hop.avg.toFixed(1) }} ms</td>
                  <td style="text-align: right;">{{ hop.wrst.toFixed(1) }} ms</td>
                  <td style="text-align: right;">{{ hop.stdev.toFixed(1) }}</td>
                </tr>
              </tbody>
            </table>
            <div class="mtr-timestamp">数据更新时间: {{ lastUpdateTime }}</div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/utils/request.js'
import { useServerStore } from '@/store/server.js'

const route = useRoute()
const router = useRouter()
const serverStore = useServerStore()

const form = ref({ node_id: '', target_select: '', target_manual: '' })
const isRunning = ref(false)
const statusText = ref('')
const resultData = ref([])
const lastUpdateTime = ref('')
const targetOptions = ref([])
let pollInterval = null
let currentTaskId = null

const currentUnixTime = ref(Date.now() / 1000)
let timeInterval = null

const historyData = ref([])

const installedNodes = computed(() => {
  return route.query.nodes ? route.query.nodes.split(',') : []
})

const onlineServers = computed(() => {
  const installedSet = new Set(installedNodes.value)
  return serverStore.servers.filter(s => {
    const isOnline = (currentUnixTime.value - s.last_active < 180)
    const isInstalled = installedSet.has(s.node_id)
    return isOnline && isInstalled
  })
})

const finalTarget = computed(() => {
  return form.value.target_manual.trim() || form.value.target_select
})

const goBack = () => {
  if (isRunning.value) return
  router.back()
}

const onSelectTarget = () => {
  if (form.value.target_select) form.value.target_manual = ''
}

const onManualInput = () => {
  if (form.value.target_manual) form.value.target_select = ''
}

const formatTime = (ts) => {
  if (!ts) return '-'
  return new Date(ts * 1000).toLocaleString()
}

const fetchTargets = async () => {
  try {
    const data = await request.get('/api/admin/tasks/all')
    const map = new Map()
    if (data && data.length > 0) {
      data.forEach(task => {
        if (task.target && task.name) {
          const ipOrDomain = task.target.split(':')[0]
          // 以地址为键去重，保留首次遍历到的任务名称
          if (!map.has(ipOrDomain)) {
            map.set(ipOrDomain, { name: task.name, target: ipOrDomain })
          }
        }
      })
    }
    targetOptions.value = Array.from(map.values())
  } catch (e) {
    console.error('获取目标列表失败:', e)
  }
}

const fetchHistory = async () => {
  if (!form.value.node_id) {
    historyData.value = []
    return
  }
  try {
    const res = await request.get('/api/admin/plugin/history', { 
      params: { node_id: form.value.node_id, ext_id: 'mtr-plugin' } 
    })
    historyData.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (e) {
    console.error('获取历史记录失败', e)
    historyData.value = []
  }
}

const viewHistoryRecord = (record) => {
  if (record.result_data && record.result_data.hops) {
    resultData.value = record.result_data.hops
    lastUpdateTime.value = formatTime(record.timestamp) + ' (历史快照)'
    // 根据泛化前留存的历史数据结构兼容提取 target
    form.value.target_manual = record.result_data.target || '历史数据'
    form.value.target_select = ''
    statusText.value = '正在查看历史诊断快照'
  }
}

onMounted(() => {
  if (serverStore.servers.length === 0) serverStore.fetchStaticServers()
  fetchTargets()
  
  timeInterval = setInterval(() => {
    currentUnixTime.value = Date.now() / 1000
  }, 5000)
})

watch(onlineServers, (newVal) => {
  if (!form.value.node_id && newVal.length > 0) {
    form.value.node_id = newVal[0].node_id
  }
}, { immediate: true })

watch(() => form.value.node_id, (newVal) => {
  if (newVal) fetchHistory()
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
  if (pollInterval) clearInterval(pollInterval)
})

const startDiagnostics = async () => {
  const target = finalTarget.value
  if (!form.value.node_id || !target) return
  
  isRunning.value = true
  statusText.value = '正在向探针下发执行指令...'
  resultData.value = []
  
  try {
    const res = await request.post('/api/admin/plugin/execute', { 
      node_id: form.value.node_id, 
      ext_id: 'mtr-plugin',
      args: ['-target', target]
    })
    const payload = res.data || res
    currentTaskId = payload.task_id
    statusText.value = '路由追踪执行中，通常耗时 10~30 秒，请稍候...'
    startPolling() // 移除 target 参数
  } catch (err) {
    statusText.value = '指令下发失败，目标探针可能离线。'
    isRunning.value = false
  }
}

const startPolling = () => {
  if (pollInterval) clearInterval(pollInterval)
  
  pollInterval = setInterval(async () => {
    try {
      const res = await request.get('/api/admin/plugin/result', {
        params: { node_id: form.value.node_id, ext_id: 'mtr-plugin', task_id: currentTaskId, _t: Date.now() }
      })
      
      const payload = res.data?.status ? res.data : res

      if (payload && payload.status === 'success' && payload.data) {
        if (payload.data.error) {
          statusText.value = `诊断失败: ${payload.data.error}`
          isRunning.value = false
          clearInterval(pollInterval)
          return
        }

        if (Array.isArray(payload.data.hops)) {
          resultData.value = payload.data.hops
          lastUpdateTime.value = new Date(payload.timestamp * 1000).toLocaleString()
          statusText.value = '' 
          isRunning.value = false
          clearInterval(pollInterval)
          fetchHistory() // 诊断完成后刷新当前节点的历史记录
        }
      }
    } catch (err) {
      clearInterval(pollInterval)
      isRunning.value = false
      statusText.value = '获取结果异常或超时中断。'
    }
  }, 3000)
}
</script>

<style scoped>
.view-section { width: 100%; }
.flex-header { display: flex; justify-content: space-between; align-items: center; }

.inner-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-main);
  margin-top: 0;
  margin-bottom: 16px;
}

.divider {
  height: 1px;
  background-color: var(--border-color);
  margin-bottom: 24px;
}

/* 表单与输入框 */
.form-group { margin-bottom: 16px; display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 13px; color: var(--text-main); font-weight: 500; }
.form-control { width: 100%; padding: 8px 10px; border: 1px solid var(--border-color); border-radius: 6px; background-color: var(--surface-color, #ffffff); color: var(--text-main); font-size: 14px; font-family: inherit; box-sizing: border-box; outline: none; transition: all 0.2s; }
.form-control:focus { border-color: var(--primary-color, #10b981); box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15); }
.form-control:disabled { background-color: rgba(0, 0, 0, 0.03); cursor: not-allowed; }

/* 状态栏 */
.mtr-status-bar { padding: 12px; background: var(--bg-color); border-radius: 6px; color: var(--text-muted); font-size: 13px; text-align: center; margin-bottom: 16px; }
.mtr-status-bar.running { color: var(--primary-color, #059669); background: #d1fae5; animation: pulse 2s infinite; }

/* 表格公用样式 */
.table-responsive { width: 100%; overflow-x: auto; }
.mtr-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; border: 1px solid var(--border-color); border-radius: 6px; }
.mtr-table th, .mtr-table td { padding: 10px 12px; border-bottom: 1px solid var(--border-color); white-space: nowrap; }
.mtr-table th { background: var(--bg-color); font-weight: 500; color: var(--text-muted); }

/* 结果表格微调 */
.high-loss { color: #ef4444; font-weight: 600; }
.mtr-timestamp { text-align: right; margin-top: 8px; font-size: 12px; color: var(--text-muted); }

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
</style>