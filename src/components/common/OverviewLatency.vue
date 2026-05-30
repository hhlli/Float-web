<template>
  <div class="latency-inline-container">
    <div v-if="latencyData.length === 0" class="latency-loading">加载延迟中...</div>
    <div v-else class="latency-inline-list">
      <span v-for="net in latencyData" :key="net.task_name" class="latency-inline-item">
        <span class="net-name">{{ net.task_name }}</span>
        <span class="ping-value" :style="getPingStyle(net.current_ping)">
          {{ net.current_ping > 0 ? net.current_ping + 'ms' : '超时' }}
        </span>
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import request from '@/utils/request.js'

const props = defineProps({
  server: Object
})

const latencyData = ref([])
let latencyTimer = null

// 返回字体颜色与浅色背景的组合对象
const getPingStyle = (ping) => {
  const val = Number(ping)
  if (isNaN(val) || val <= 0) return { color: '#64748b', backgroundColor: '#f1f5f9' } // 灰色/超时
  if (val <= 80) return { color: '#059669', backgroundColor: '#dcfce7' } // 绿色/优秀
  if (val <= 200) return { color: '#d97706', backgroundColor: '#fef3c7' } // 橙色/一般
  return { color: '#dc2626', backgroundColor: '#fee2e2' } // 红色/较差
}

const fetchLatency = async () => {
  const nodeId = props.server?.node_id
  if (!nodeId) return
  
  try {
    const rawData = await request.get(`/api/data/ping?node_id=${nodeId}&range=realtime`) || []
    const networkMap = {
      '电信': { keywords: ['-ct-', 'telecom', 'chinanet'], pings: [] },
      '联通': { keywords: ['-cu-', 'unicom', '10010'], pings: [] },
      '移动': { keywords: ['-cm-', 'mobile', '10086'], pings: [] }
    }

    const latestRawMap = {}
    for (const row of rawData) {
      const target = (row.target || '').toLowerCase()
      latestRawMap[target] = row.ping_ms ?? row.latency_ms ?? 0
    }

    for (const [target, ping] of Object.entries(latestRawMap)) {
      if (ping <= 0) continue
      for (const [netName, config] of Object.entries(networkMap)) {
        if (config.keywords.some(kw => target.includes(kw))) {
          config.pings.push(ping)
          break
        }
      }
    }

    latencyData.value = Object.entries(networkMap).map(([netName, config]) => ({
      task_name: netName,
      current_ping: config.pings.length > 0 
        ? (config.pings.reduce((a, b) => a + b, 0) / config.pings.length).toFixed(1) 
        : 0
    }))
  } catch (e) {
    console.error('Fetch latency error:', e)
  }
}

watch(() => props.server?.node_id, (newId) => {
  if (newId) fetchLatency()
}, { immediate: true })

onMounted(() => {
  fetchLatency()
  latencyTimer = setInterval(fetchLatency, 5000)
})

onUnmounted(() => {
  if (latencyTimer) clearInterval(latencyTimer)
})
</script>

<style scoped>
.latency-inline-container { display: inline-block; width: 100%; }
.latency-loading { font-size: 13px; color: var(--text-muted); }
.latency-inline-list { display: flex; flex-wrap: wrap; gap: 8px 16px; }

/* 移除整体背景色，改为水平弹性布局控制间距 */
.latency-inline-item { 
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px; 
}

.net-name {
  color: var(--text-muted);
}

/* 延迟数值专属背景区块 */
.ping-value { 
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; 
  font-weight: 600; 
  padding: 2px 6px;
  border-radius: 4px;
}
</style>