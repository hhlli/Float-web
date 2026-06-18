<template>
  <BaseModal :show="show" title="MTR 路由诊断" @close="closeModal" custom-style="max-width: 500px; width: 90%;">
    
    <div class="form-group">
      <label>起点服务器 (探针)</label>
      <select v-model="form.node_id" class="form-control" :disabled="isRunning">
        <option value="" disabled>请选择在线节点...</option>
        <option v-for="s in onlineServers" :key="s.node_id" :value="s.node_id">
          {{ s.name }} ({{ s.region || '未知' }})
        </option>
      </select>
    </div>

    <div class="form-group">
      <label>目标地址 (快捷选择)</label>
      <select v-model="form.target_select" class="form-control" :disabled="isRunning" @change="onSelectTarget">
        <option value="">-- 手动输入新地址 --</option>
        <option v-for="t in targetOptions" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>
    
    <div class="form-group">
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

    <template #footer>
      <button class="btn-outline" @click="closeModal">关闭</button>
      <button class="btn-primary" @click="startDiagnostics" :disabled="isRunning || !form.node_id || !finalTarget">
        {{ isRunning ? '诊断中...' : '开始诊断' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import request from '@/utils/request.js'
import BaseModal from '@/components/common/BaseModal.vue'
import { useServerStore } from '@/store/server.js'

const props = defineProps({ 
  show: Boolean,
  installedNodes: {
    type: Array,
    default: () => []
  }
})
const emit = defineEmits(['close'])

const serverStore = useServerStore()

const form = ref({ node_id: '', target_select: '', target_manual: '' })
const isRunning = ref(false)
const statusText = ref('')
const resultData = ref([])
const lastUpdateTime = ref('')
const targetOptions = ref([])
let pollInterval = null

// 核心拦截逻辑：过滤出既"在线"又"已安装该插件"的服务器
const currentUnixTime = ref(Date.now() / 1000)
let timeInterval = null

onMounted(() => {
  timeInterval = setInterval(() => {
    currentUnixTime.value = Date.now() / 1000
  }, 5000)
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
})

// 核心拦截逻辑：过滤出既"在线"又"已安装该插件"的服务器
const onlineServers = computed(() => {
  const installedSet = new Set(props.installedNodes)
  
  return serverStore.servers.filter(s => {
    const isOnline = (currentUnixTime.value - s.last_active < 180)
    const isInstalled = installedSet.has(s.node_id)
    return isOnline && isInstalled
  })
})

const finalTarget = computed(() => {
  return form.value.target_manual.trim() || form.value.target_select
})

const onSelectTarget = () => {
  if (form.value.target_select) {
    form.value.target_manual = ''
  }
}

const onManualInput = () => {
  if (form.value.target_manual) {
    form.value.target_select = ''
  }
}

const fetchTargets = async () => {
  try {
    const data = await request.get('/api/admin/tasks/all')
    const targets = new Set()
    if (data && data.length > 0) {
      data.forEach(task => {
        if (task.target) targets.add(task.target.split(':')[0])
      })
    }
    targetOptions.value = Array.from(targets)
  } catch (e) {
    console.error('Failed to fetch targets:', e)
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    if (serverStore.servers.length === 0) serverStore.fetchStaticServers()
    fetchTargets()
    form.value.node_id = onlineServers.value.length > 0 ? onlineServers.value[0].node_id : ''
    form.value.target_select = ''
    form.value.target_manual = ''
    resultData.value = []
    statusText.value = '' 
  } else {
    isRunning.value = false
    if (pollInterval) clearInterval(pollInterval)
  }
})

const closeModal = () => emit('close')

const startDiagnostics = async () => {
  const target = finalTarget.value
  if (!form.value.node_id || !target) return
  
  isRunning.value = true
  statusText.value = '正在向探针下发执行指令...'
  resultData.value = []
  
  try {
    await request.post('/api/admin/mtr/run', { node_id: form.value.node_id, target: target })
    statusText.value = '路由追踪执行中，通常耗时 10~30 秒，请稍候...'
    startPolling(target)
  } catch (err) {
    statusText.value = '指令下发失败，目标探针可能离线。'
    isRunning.value = false
  }
}

const startPolling = (target) => {
  if (pollInterval) clearInterval(pollInterval)
  
  pollInterval = setInterval(async () => {
    try {
      // 1. 强制追加 _t 时间戳，击穿浏览器 GET 缓存，确保每次都向服务端拉取真实状态
      const res = await request.get('/api/admin/mtr/result', {
        params: { node_id: form.value.node_id, target: target, _t: Date.now() }
      })
      
      // 2. 兼容 Axios 原始响应与拦截器提取后的响应层级
      const payload = res.data && res.data.status ? res.data : res

      if (payload && payload.status === 'success' && payload.data) {
        // 优先拦截并处理探针或插件显式回传的错误，阻止轮询无休止挂起
        if (payload.data.error) {
          statusText.value = `诊断失败: ${payload.data.error}`
          isRunning.value = false
          clearInterval(pollInterval)
          return
        }

        // 解析正常的跳数路由数据
        if (Array.isArray(payload.data.hops)) {
          resultData.value = payload.data.hops
          lastUpdateTime.value = new Date(payload.timestamp * 1000).toLocaleString()
          statusText.value = '' 
          isRunning.value = false
          clearInterval(pollInterval)
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
.form-group {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form-group label {
  font-size: 13px;
  color: var(--text-main);
  font-weight: 500;
}

.form-control {
  width: 100%;
  /* 核心修复 1：移除 height: 40px，改用 padding 天然撑开，与编辑节点保持 100% 一致 */
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: var(--surface-color, #ffffff);
  color: var(--text-main);
  font-size: 14px;
  font-family: inherit;
  box-sizing: border-box;
  outline: none;
  transition: all 0.2s;
}
.form-control:focus {
  /* 核心修复 2：移除写死的蓝色，改用系统的 var(--primary-color) 主题色 */
  border-color: var(--primary-color, #10b981);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15); 
}
.form-control:disabled {
  background-color: rgba(0, 0, 0, 0.03);
  cursor: not-allowed;
}

/* 核心修复 3：彻底删除了之前强加的 select.form-control 的自定义图标，让下拉框使用系统原生的箭头 */

.mtr-status-bar { padding: 12px; background: var(--bg-color); border-radius: 6px; color: var(--text-muted); font-size: 13px; text-align: center; margin-bottom: 16px; }
.mtr-status-bar.running { color: var(--primary-color, #059669); background: #d1fae5; animation: pulse 2s infinite; }

.table-responsive { width: 100%; overflow-x: auto; margin-top: 8px; }
.mtr-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; border: 1px solid var(--border-color); border-radius: 6px; }
.mtr-table th, .mtr-table td { padding: 10px 12px; border-bottom: 1px solid var(--border-color); white-space: nowrap; }
.mtr-table th { background: var(--bg-color); font-weight: 500; color: var(--text-muted); }
.high-loss { color: #ef4444; font-weight: 600; }
.mtr-timestamp { text-align: right; margin-top: 8px; font-size: 12px; color: var(--text-muted); }

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
</style>