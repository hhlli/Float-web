<template>
  <div class="charts-container">
    <div class="charts-controls">
      <div class="control-left">
        <SwipePicker 
          size="small"
          v-model="activeRange"
          :options="timeRangeOptions" 
        />
      </div>
      <div class="control-right">
        <div class="switch-container">
          <span class="switch-label">{{ chartType === 'load' ? '连接空值' : '平滑曲线' }}</span>
          <label class="toggle-switch">
            <input type="checkbox" v-model="currentToggleValue">
            <span class="slider"></span>
          </label>
        </div>

        <SlidingTabs 
          size="small"
          v-model="chartType"
          :options="chartTypeOptions" 
        />
      </div>
    </div>

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
        :legendSelected="legendSelected"
        @update:legendSelected="val => legendSelected = val"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, toRef, watch, computed, onUnmounted } from 'vue'
import { useChartData } from '@/composables/server-detail/useChartData.js'
import { useChartOptions } from '@/composables/server-detail/useChartOptions.js'
import { loadTimeRanges, latencyTimeRanges } from '@/composables/server-detail/chartUtils.js'
import SlidingTabs from '@/components/common/SlidingTabs.vue'
import SwipePicker from '@/components/common/SwipePicker.vue'
import ViewLoad from './ViewLoad.vue'
import ViewNetwork from './ViewNetwork.vue'

const props = defineProps({
  server: Object
})

const chartType    = ref('load')
const loadRange = ref('realtime')
const latencyRange = ref('1h')
const isConnectNulls = ref(false)
const isSmooth = ref(false)
const serverRef    = toRef(props, 'server')

const currentToggleValue = computed({
  get: () => chartType.value === 'load' ? isConnectNulls.value : isSmooth.value,
  set: (val) => {
    if (chartType.value === 'load') {
      isConnectNulls.value = val
    } else {
      isSmooth.value = val
    }
  }
})

const activeRange = computed({
  get: () => chartType.value === 'load' ? loadRange.value : latencyRange.value,
  set: (val) => {
    if (chartType.value === 'load') {
      loadRange.value = val
    } else {
      latencyRange.value = val
    }
  }
})

const chartTypeOptions = [
  { label: '负载', value: 'load' },
  { label: '延迟', value: 'network' }
]

const timeRangeOptions = computed(() => {
  const ranges = chartType.value === 'load' ? loadTimeRanges : latencyTimeRanges
  return ranges.map(t => ({ label: t.label, value: t.key }))
})


const { metricsData, pingData, isLoading, hasData, currentCPU, fetchData, startPoll, stopPoll, reset } = useChartData(serverRef)

// 🌟 将 isConnectNulls 作为第四个参数传入
const legendSelected = ref({})
const { cpuOption, memOption, diskOption, netOption, connOption, procOption, pingSummaryData, mergedPingOption } = useChartOptions(metricsData, pingData, isSmooth, isConnectNulls, legendSelected)

watch(
  () => [activeRange.value, props.server?.node_id],
  (newVal, oldVal) => {
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

.charts-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

/* 🌟 修改右侧容器样式以对齐开关和选项卡 */
.control-right {
  display: flex;
  align-items: center;
  gap: 16px; 
}

/* 🌟 开关组件样式 */
.switch-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.switch-label {
  font-size: 13px;
  color: var(--text-muted, #64748b);
  user-select: none;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 32px;
  height: 18px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: var(--border-color, #e2e8f0);
  transition: .3s;
  border-radius: 18px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

input:checked + .slider {
  background-color: #10b981; 
}

input:checked + .slider:before {
  transform: translateX(14px);
}

.dark .slider {
  background-color: #334155;
}

.loading-state, .empty-state { padding: 60px 0; text-align: center; color: #94a3b8; }
.spinner { width: 24px; height: 24px; border: 2px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }
.charts-grid-container { position: relative; padding: 0; flex: 1; width: 100%; display: flex; flex-direction: column; }

@media (max-width: 768px) {
  .charts-controls {
    flex-direction: row; /* 强制水平排列 */
    align-items: center;
    justify-content: space-between;
    gap: 8px; /* 缩小组件间距 */
  }
  
  .control-right {
    width: auto;
    flex: 1; /* 占据剩余空间 */
    justify-content: flex-end; /* 内容靠右对齐 */
    gap: 10px;
  }

  .switch-label {
    font-size: 12px; /* 移动端稍微缩小文字防止拥挤 */
  }
}
</style>