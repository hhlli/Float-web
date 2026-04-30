<template>
  <div class="charts-container">
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <span>加载图表数据...</span>
    </div>

    <div v-else-if="!hasData" class="empty-state">
      <p>暂无历史数据</p>
    </div>

    <div v-else class="charts-grid-container">
      <ViewLoad
        v-if="chartType === 'load'"
        :server="server"
        :currentCPU="currentCPU"
        :cpuOption="cpuOption"
        :memOption="memOption"
        :diskOption="diskOption"
        :netOption="netOption"
        :connOption="connOption"
        :procOption="procOption"
      />
      <ViewNetwork
        v-if="chartType === 'network'"
        :pingSummaryData="pingSummaryData"
        :mergedPingOption="mergedPingOption"
        :pingRawData="pingData"
      />
    </div>
  </div>
</template>

<script setup>
import { toRef, watch, onUnmounted } from 'vue'
import { useChartData } from './useChartData.js'
import { useChartOptions } from './useChartOptions.js'
import ViewLoad from './ViewLoad.vue'
import ViewNetwork from './ViewNetwork.vue'

const props = defineProps({
  server:            Object,
  externalChartType: String,
  externalRange:     String,
  externalSmooth:    Boolean
})

const chartType    = toRef(props, 'externalChartType')
const activeRange  = toRef(props, 'externalRange')
const isSmoothMode = toRef(props, 'externalSmooth')
const serverRef    = toRef(props, 'server')

// ← 解构时加入 reset
const { metricsData, pingData, isLoading, hasData, currentCPU, fetchData, startPoll, stopPoll, reset } = useChartData(serverRef)
const { cpuOption, memOption, diskOption, netOption, connOption, procOption, pingSummaryData, mergedPingOption } = useChartOptions(metricsData, pingData, isSmoothMode)

// 修改后：监听具体的基础数据类型 (Primitive values)
// 替换原有的 watch([activeRange, serverRef], ...) 逻辑
watch(
  () => [activeRange.value, props.server?.node_id],
  (newVal, oldVal) => {
    // 避免外层轮询传递的新对象引发不必要的重置
    if (oldVal && newVal[0] === oldVal[0] && newVal[1] === oldVal[1]) {
      return
    }
    
    stopPoll()
    reset()
    fetchData(activeRange.value)
    startPoll(activeRange)
  },
  { immediate: true }
)

onUnmounted(() => {
  stopPoll()
})
</script>

<style scoped>
.charts-container { display: flex; flex-direction: column; height: 100%; }
.loading-state, .empty-state { padding: 60px 0; text-align: center; color: #94a3b8; }
.spinner { width: 24px; height: 24px; border: 2px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }
.charts-grid-container { position: relative; padding: 0; flex: 1; width: 100%; display: flex; flex-direction: column; }
</style>