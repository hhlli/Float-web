// src/components/public/server-detail/useEChart.js
import { onMounted, onUnmounted, watch, ref } from 'vue'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components'

echarts.use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent])

/**
 * 绑定一个 ECharts 实例到 DOM ref，并在 option 变化时静默增量更新
 * @param {Ref<HTMLElement>} domRef  - 容器 DOM ref
 * @param {Ref<object>}      option  - 响应式 option（computed 或 ref）
 */
export function useEChart(domRef, option) {
  let chart = null

  const init = () => {
    if (!domRef.value || chart) return
    chart = echarts.init(domRef.value, null, { renderer: 'canvas' })
    if (option.value && Object.keys(option.value).length) {
      chart.setOption(option.value, { notMerge: true })
    }
  }

  const update = (opt) => {
    if (!chart || !opt || !Object.keys(opt).length) return
    // notMerge:false = 增量更新，只替换数据，不重建坐标轴和系列
    chart.setOption(opt, { notMerge: false, lazyUpdate: true, silent: true })
  }

  // option 变化时增量推送，不重建实例
  watch(option, (newOpt) => update(newOpt), { deep: false })

  // 窗口 resize
  const onResize = () => chart?.resize()
  window.addEventListener('resize', onResize)

  onMounted(init)
  onUnmounted(() => {
    window.removeEventListener('resize', onResize)
    chart?.dispose()
    chart = null
  })
}