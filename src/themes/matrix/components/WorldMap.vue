<template>
  <div ref="domMap" class="map-container"></div>
</template>

<script setup>
import { ref, shallowRef, onMounted, onUnmounted, watch, nextTick, computed } from 'vue' // 🌟 修复：导入 computed
import * as echarts from 'echarts'
import { buildMapOption } from './mapOption.js'

const props = defineProps({
  servers:         { type: Array,  default: () => [] },
  serverLat:       { type: Number, default: 31.2304  },
  serverLon:       { type: Number, default: 121.4737 },
  onlineThreshold: { type: Number, default: 180      },
})

const emit = defineEmits(['select-server'])
const domMap = ref(null)

const chart = shallowRef(null)
let resizeObserver = null

const getCleanProps = () => ({
  servers: JSON.parse(JSON.stringify(props.servers)),
  serverLat: props.serverLat,
  serverLon: props.serverLon,
  onlineThreshold: props.onlineThreshold
})

const initChart = async () => {
  if (!domMap.value) return

  // 1. 加载地图数据
  const worldJson = await import('@/assets/world.json')
  echarts.registerMap('world', worldJson.default || worldJson)

  // 2. 动态获取当前系统激活的主题名称
  const currentTheme = localStorage.getItem('float_theme') || 'default'
  const themeName = currentTheme === 'default' ? null : currentTheme

  // 3. 动态获取当前设备像素比，最高限制为 1.5
  const optimalDpr = Math.min(window.devicePixelRatio || 1, 1.5)

  // 4. 传入主题与像素比进行初始化
  chart.value = echarts.init(domMap.value, themeName, { 
    renderer: 'canvas',
    devicePixelRatio: optimalDpr
  })

  // 5. 挂载配置
  chart.value.setOption(buildMapOption(getCleanProps()))

  // 6. 绑定点击事件
  chart.value.on('click', (params) => {
    const nodeId = params.data?.node_id
    if (nodeId) {
      const s = props.servers.find(item => item.node_id === nodeId)
      if (s) emit('select-server', s)
    }
  })

  // 7. 防抖重绘监听
  let resizeTimer = null
  resizeObserver = new ResizeObserver(() => {
    if (chart.value) {
      if (resizeTimer) clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        requestAnimationFrame(() => {
          chart.value.resize()
        })
      }, 100)
    }
  })
  resizeObserver.observe(domMap.value)
}

const updateChart = () => {
  if (!chart.value || chart.value.isDisposed()) return

  requestAnimationFrame(() => {
    try {
      const fullOption = buildMapOption(getCleanProps())
      // 🌟 优化：即使发生上下线重绘，也仅更新 series 数据，不覆盖 geo 配置，彻底防止地图视口弹回重置
      chart.value.setOption({
        series: fullOption.series
      }, { notMerge: false })
    } catch (e) {
      console.warn('Map update aborted to prevent state collision:', e)
    }
  })
}

onMounted(() => {
  nextTick(initChart)
})

onUnmounted(() => {
  if (resizeObserver && domMap.value) {
    resizeObserver.unobserve(domMap.value)
    resizeObserver.disconnect()
  }
  if (chart.value) {
    chart.value.dispose()
    chart.value = null
  }
})

// 仅当节点数量、坐标或在线状态发生改变时触发重绘
const statusFingerprint = computed(() => {
  return props.servers.map(s => {
    const online = (Date.now() / 1000 - (s.last_active || 0)) < props.onlineThreshold
    return `${s.node_id}:${s.longitude}:${s.latitude}:${online ? 1 : 0}`
  }).join('|')
})

watch(
  [statusFingerprint, () => props.serverLat, () => props.serverLon], 
  () => {
    updateChart()
  }
)
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  background: #020d1a;
}
</style>