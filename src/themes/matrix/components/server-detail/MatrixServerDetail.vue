<template>
  <div class="ssh-terminal-container">
    
    <div class="terminal-header-row">
      <div class="terminal-line prompt">
        admin@float-web:~# ./view_node_spec.sh --target={{ activeTab.toUpperCase() }}<template v-if="activeTab === 'load'"> --range={{ loadRange.toUpperCase() }}</template>
      </div>
      
      <div v-show="activeTab === 'load'" class="time-range-tabs">
        <button
          v-for="opt in loadTimeOptions"
          :key="opt.value"
          :class="['time-tab-btn', { active: loadRange === opt.value }]"
          @click="handleRangeChange(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <div class="terminal-content-body">
      <MatrixOverview 
        v-show="activeTab === 'overview'" 
        :server="server" 
        :online-threshold="onlineThreshold" 
      />
      
      <div v-show="activeTab === 'load'" class="tab-pane-wrapper">
        <MatrixLoadCharts
          :server="server"
          :currentCPU="currentCPU"
          :cpuOption="cpuOption"
          :memOption="memOption"
          :diskOption="diskOption"
          :netOption="netOption"
          :connOption="connOption"
          :procOption="procOption"
        />
      </div>

      <MatrixNetworkCharts
        v-show="activeTab === 'latency'"
        :pingSummaryData="pingSummaryData"
        :mergedPingOption="mergedPingOption"
        :pingRawData="pingData"
        :isAllHidden="isAllHidden"
        @toggle-legend="isAllHidden = !isAllHidden"
        @legend-change="val => isAllHidden = val"
      />
    </div>

    <div class="terminal-line prompt cursor-blink">admin@float-web:~# <span class="blink">█</span></div>
  </div>
</template>

<script setup>
import { ref, toRef, watch, onUnmounted, nextTick } from 'vue'
import MatrixOverview from './MatrixOverview.vue'
import MatrixLoadCharts from './MatrixLoadCharts.vue'
import MatrixNetworkCharts from './MatrixNetworkCharts.vue'

// 引用 default 目录下的基础库
import { useChartData } from '@/composables/server-detail/useChartData.js'
import { useChartOptions } from '@/composables/server-detail/useChartOptions.js'

const props = defineProps({
  server: { type: Object, required: true },
  activeTab: { type: String, default: 'overview' },
  onlineThreshold: { type: Number, default: 180 }
})

const serverRef = toRef(props, 'server')
const isConnectNulls = ref(false)
const isAllHidden = ref(false)

const { metricsData, pingData, isLoading, currentCPU, fetchData, startPoll, stopPoll, reset } = useChartData(serverRef)
const { cpuOption, memOption, diskOption, netOption, connOption, procOption, pingSummaryData, mergedPingOption } = useChartOptions(metricsData, pingData, false, isConnectNulls, isAllHidden)

// 🌟 新增：时间周期选择逻辑与配置字典
const loadRange = ref('realtime')
const loadTimeOptions = [
  { label: 'LIVE', value: 'realtime' },
  { label: '1h', value: '1h' },
  { label: '6h', value: '6h' },
  { label: '1d', value: '1d' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '720h' }
]

// 🌟 新增：切换周期时，停止轮询，清空重绘，重新拉取历史数据
const handleRangeChange = (range) => {
  if (loadRange.value === range) return
  loadRange.value = range
  stopPoll()
  reset() 
  fetchData(range)
  // 仅在实时模式下开启自动轮询
  if (range === 'realtime') {
    startPoll({ value: 'realtime' })
  }
}

watch(() => props.server?.node_id, (newId) => {
    if (!newId) return
    stopPoll()
    reset()
    // 🌟 修复：不再写死 realtime，而是根据当前激活的 loadRange 进行抓取
    fetchData(loadRange.value)
    if (loadRange.value === 'realtime') {
      startPoll({ value: 'realtime' })
    }
}, { immediate: true })

onUnmounted(() => stopPoll())

watch(() => props.activeTab, (newTab) => {
  if (newTab === 'load' || newTab === 'latency') {
    nextTick(() => {
      window.dispatchEvent(new Event('resize'))
    })
  }
})

</script>

<style scoped>

.terminal-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap; /* 防止屏幕极窄时重叠，自动折行 */
  gap: 12px;
}

.ssh-terminal-container {
  width: 100%;
  min-height: 100%;
  background: #010810;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: #a0ffcc;
  font-family: 'Courier New', monospace;
}
.terminal-content-body {
  flex: 1;
  width: 100%;
  margin: 12px 0;
}

/* 🌟 新增：子 Tab 的样式 */
.tab-pane-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.time-range-tabs {
  display: flex;
  gap: 6px;
}

.time-tab-btn {
  background: transparent;
  border: none;
  color: #3a7a55; 
  font-family: 'Courier New', monospace;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 6px 10px; 
  border-radius: 4px; /* 增加微弱圆角，配合悬停背景 */
}

.time-tab-btn:hover {
  color: #00aa55;
}

.time-tab-btn.active {
  color: #00ff88; 
  text-shadow: 0 0 8px rgba(0, 255, 136, 0.3); 
}

/* 终端命令行特效 */
.terminal-line { word-break: break-all; white-space: pre-wrap; }
.terminal-line.prompt { color: #00ff88; font-weight: 700; }
.blink { animation: terminal-blink 1s steps(2, start) infinite; }
@keyframes terminal-blink { to { visibility: hidden; } }

</style>