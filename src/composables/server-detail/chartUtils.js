import { ref } from 'vue'

export const isDarkMode = ref(document.documentElement.classList.contains('dark'))

if (typeof window !== 'undefined') {
  const observer = new MutationObserver(() => {
    isDarkMode.value = document.documentElement.classList.contains('dark')
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
}

export const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const formatSpeed = (b) => formatBytes(b) + '/s'

export const loadTimeRanges = [
  { key: 'realtime', label: '实时' },
  { key: '1h',       label: '1 小时' },
  { key: '6h',       label: '6 小时' },
  { key: '1d',       label: '1 天' },
  { key: '7d',       label: '7 天' },
  { key: '720h',     label: '720 小时' },
]

export const latencyTimeRanges = [
  { key: '1h', label: '1 小时' },
  { key: '6h', label: '6 小时' },
  { key: '1d', label: '1 天' }, 
]

export const rangeToSeconds = {
  realtime: 5 * 60,
  '1h':     3600,
  '6h':     6 * 3600,
  '12h':    12 * 3600,
  '24h':    86400, 
  '1d':     86400,
  '7d':     7 * 86400,
  '720h':   720 * 3600,
}

export const makeLineOption = ({ title, series, yFormatter, yMax, colors, showLegend = false, smooth = false, legendSelected = {} }) => {
  
  const textMuted = isDarkMode.value ? '#94a3b8' : '#64748b'
  const textMain = isDarkMode.value ? '#f8fafc' : '#1e293b'
  const surfaceBg = isDarkMode.value ? '#1e293b' : '#ffffff'
  const borderColor = isDarkMode.value ? '#334155' : '#e2e8f0'

  return {
    animation: false,
    grid: { 
      top: 24, 
      right: 16, 
      bottom: showLegend ? 40 : 16, 
      left: 8, 
      containLabel: true 
    },
    // 🌟 新增 dataZoom 属性
    dataZoom: [
      {
        type: 'inside', // 设置为 inside 模式，支持移动端双指缩放和单指拖动，且不显示多余的 UI 滑块
        xAxisIndex: 0,  // 绑定到 X 轴（时间轴）
        filterMode: 'filter'
      }
    ],
    legend: {
      show: showLegend,
      bottom: 0,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: textMuted, fontSize: 12 },
selected: legendSelected// 🌟
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: surfaceBg,
      borderColor: borderColor,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: textMain, fontSize: 12 },
      formatter: (params) => {
        if (!params?.length) return ''
        const date = new Date(params[0].value[0])
        const m = (date.getMonth() + 1).toString().padStart(2, '0')
        const d = date.getDate().toString().padStart(2, '0')
        const h = date.getHours().toString().padStart(2, '0')
        const min = date.getMinutes().toString().padStart(2, '0')
        const timeStr = `${m}-${d} ${h}:${min}`
        
        const lines = params.map(p => {
          const rawVal = p.value[1]
          const val = rawVal == null ? '无数据' : (yFormatter ? yFormatter(rawVal) : rawVal)
          return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px;"></span>${p.seriesName}: <b style="font-weight:600;">${val}</b>`
        })
        return `<div style="font-size:12px;line-height:1.8">${timeStr}<br>${lines.join('<br>')}</div>`
      }
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
      axisLine: { show: false },
      axisTick: { show: false },
      // 控制分割段数，避免密集（例如设为 4 或 5）
      splitNumber: 4, 
      axisLabel: { 
        color: textMuted,
        fontSize: 11,
        // 强制开启防重叠隐藏机制
        hideOverlap: true, 
        formatter: {
          month: '{MM}-{dd}',
          day: '{MM}-{dd}',
          hour: '{HH}:{mm}',
          minute: '{HH}:{mm}'
        }
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: yMax,
      axisLabel: { 
        color: textMuted,
        fontSize: 11, 
        formatter: yFormatter || null,
      },
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: series.map((s, i) => ({
      name: s.name,
      type: 'line',
      data: s.data,
      connectNulls: s.connectNulls || false,
      smooth: s.smooth !== undefined ? s.smooth : (smooth ? 0.4 : false),
      symbol: 'none',
      lineStyle: { width: 1, color: s.color || colors[i] },
      areaStyle: s.fill !== false ? { 
        color: { 
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1, 
          colorStops: [
            { offset: 0, color: (s.color || colors[i]) + '30' }, 
            { offset: 1, color: (s.color || colors[i]) + '00' }
          ] 
        } 
      } : undefined, 
      itemStyle: { color: s.color || colors[i] },
    }))
  }
}