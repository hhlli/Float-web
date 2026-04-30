// ── 格式化工具 ───────────────────────────────────────────
export const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const formatSpeed = (b) => formatBytes(b) + '/s'

// ── 时间范围 ─────────────────────────────────────────────
// ── 时间范围 ─────────────────────────────────────────────

// 负载视图的时间选项（保留实时）
export const loadTimeRanges = [
  { key: 'realtime', label: '实时' },
  { key: '1h',       label: '1 小时' },
  { key: '6h',       label: '6 小时' },
  { key: '1d',       label: '1 天' },
  { key: '7d',       label: '7 天' },
  { key: '720h',     label: '720 小时' },
]

// 延迟视图的时间选项（只保留1h, 6h, 12h, 24h）
// 延迟视图的时间选项
export const latencyTimeRanges = [
  { key: '1h', label: '1 小时' },
  { key: '6h', label: '6 小时' },
  { key: '1d', label: '1 天' }, // 🌟 恢复为 1d，与负载保持一致
]

export const rangeToSeconds = {
  realtime: 5 * 60,
  '1h':     3600,
  '6h':     6 * 3600,
  '12h':    12 * 3600,
  '24h':    86400, // 和1d时间相同
  '1d':     86400,
  '7d':     7 * 86400,
  '720h':   720 * 3600,
}

// ── ECharts 通用配置工厂 ─────────────────────────────────
export const makeLineOption = ({ title, labels, series, yFormatter, yMax, colors, showLegend = false, smooth = false }) => ({
  animation: false,
  grid: { 
    top: 16, 
    right: 10, 
    bottom: showLegend ? 40 : 24, // 为底部的图例留出空间
    left: 10, 
    containLabel: false 
  },
  legend: {
    show: showLegend,
    bottom: 0,
    icon: 'circle',
    itemWidth: 8,
    itemHeight: 8,
    textStyle: { color: 'var(--text-muted, #94a3b8)', fontSize: 12 }
  },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'var(--surface-color, #fff)',
    borderColor: 'var(--border-color, #e2e8f0)',
    borderWidth: 1,
    textStyle: { color: 'var(--text-main, #1e293b)', fontSize: 12 },
    formatter: (params) => {
      if (!params?.length) return ''
      const time = params[0].axisValue
      const lines = params.map(p => {
        const val = yFormatter ? yFormatter(p.value) : p.value
        return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px;"></span>${p.seriesName}: <b>${val}</b>`
      })
      return `<div style="font-size:12px;line-height:1.8">${time}<br>${lines.join('<br>')}</div>`
    }
  },
  xAxis: {
    type: 'category',
    data: labels,
    boundaryGap: false,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: 'var(--text-muted, #94a3b8)', fontSize: 11, interval: 'auto', rotate: 0 },
    splitLine: { show: false },
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: yMax,
    axisLabel: { 
      color: 'var(--text-muted, #94a3b8)', 
      fontSize: 11, 
      formatter: yFormatter || null,
      inside: true,            
      margin: 0,               
      verticalAlign: 'bottom', 
      padding: [0, 0, 4, 0]    
    },
    splitLine: { lineStyle: { color: 'var(--border-color, #e2e8f0)', type: 'dashed' } },
    axisLine: { show: false },
    axisTick: { show: false },
  },
  series: series.map((s, i) => ({
    name: s.name,
    type: 'line',
    data: s.data,
    smooth: s.smooth !== undefined ? s.smooth : (smooth ? 0.4 : false),
    symbol: 'none',
    lineStyle: { width: 1.5, color: s.color || colors[i] },
    // 🌟 修复部分 ECharts 解析 null 报错的问题，使用 undefined
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
})