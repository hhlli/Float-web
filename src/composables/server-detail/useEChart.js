import { onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components'

echarts.use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent])

export function useEChart(domRef, option) {
  let chart = null

  const init = () => {
    if (!domRef.value || chart) return
    
    // 🌟 核心拦截：如果容器宽或高为 0（处于 v-show 隐藏状态），则暂不初始化，避免警告
    if (domRef.value.clientWidth === 0 || domRef.value.clientHeight === 0) {
      return
    }
    
    const currentTheme = localStorage.getItem('float_theme') || 'default'
    const themeName = currentTheme === 'default' ? null : currentTheme
    
    chart = echarts.init(domRef.value, themeName, { renderer: 'canvas' })
    
    if (option.value && Object.keys(option.value).length) {
      chart.setOption(option.value, { notMerge: true })
    }
  }

  let lastSeriesCount = 0

  const update = (opt) => {
    // 如果图表尚未初始化（如一直在后台 Tab），忽略更新，等 init 时会自动获取最新 option
    if (!chart || !opt || !Object.keys(opt).length) return
    const seriesCount = opt.series?.length ?? 0
    const needFullReplace = seriesCount !== lastSeriesCount
    lastSeriesCount = seriesCount
    chart.setOption(opt, { notMerge: needFullReplace, lazyUpdate: true, silent: true })
  }

  watch(option, (newOpt) => update(newOpt), { deep: false })

  const onResize = () => {
    // 🌟 动态分发：如果图表未初始化，说明此时容器刚刚由隐藏变为可见，执行 init；否则执行 resize
    if (!chart) {
      init()
    } else {
      chart.resize()
    }
  }
  
  window.addEventListener('resize', onResize)

  onMounted(init)
  onUnmounted(() => {
    window.removeEventListener('resize', onResize)
    chart?.dispose()
    chart = null
  })
}