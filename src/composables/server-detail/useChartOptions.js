import { computed, unref, ref } from 'vue'
import { makeLineOption, formatSpeed, isDarkMode } from './chartUtils.js'

// 在文件顶部加入此函数
const calculateEWMA = (dataPoints, alpha = 0.2) => {
  const smoothed = []
  let lastVal = null
  
  for (let i = 0; i < dataPoints.length; i++) {
    const point = dataPoints[i]
    const timestamp = point[0]
    const yValue = point[1]

    // 处理空值断点
    if (yValue === null) {
      smoothed.push([timestamp, null])
      lastVal = null 
      continue
    }

    if (lastVal === null) {
      // 序列起点或断点后的第一个点，直接使用原值
      lastVal = yValue
      smoothed.push([timestamp, yValue])
    } else {
      // EWMA 核心计算
      lastVal = alpha * yValue + (1 - alpha) * lastVal
      smoothed.push([timestamp, parseFloat(lastVal.toFixed(2))])
    }
  }
  return smoothed
}


const PING_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

const COLORS = {
  cpu:  '#ef4444',
  mem:  '#f59e0b',
  disk: '#14b8a6',
  tx:   '#ef4444',
  rx:   '#14b8a6',
  tcp:  '#ef4444',
  udp:  '#a78bfa',
  proc: '#ef4444',
}

export function useChartOptions(metricsData, pingData, isSmooth = false, isConnectNulls = false, legendSelected = ref({})) {

  const cpuOption = computed(() => {
    const _dark = isDarkMode.value // 建立响应式依赖
    const d = metricsData.value
    if (!d || !d.length) return {}
    const connectVal = unref(isConnectNulls)
    return makeLineOption({
      series: [{ 
        name: 'CPU %', 
        data: d.map(r => [r.timestamp * 1000, r.cpu == null ? null : parseFloat(r.cpu.toFixed(2))]), 
        color: COLORS.cpu,
        connectNulls: connectVal
      }],
      yFormatter: v => v.toFixed(1) + '%',
      yMax: 100,
      colors: [COLORS.cpu]
    })
  })

  const memOption = computed(() => {
    const _dark = isDarkMode.value // 建立响应式依赖
    const d = metricsData.value
    if (!d || !d.length) return {}
    const connectVal = unref(isConnectNulls)
    return makeLineOption({
      series: [{ 
        name: '内存 %', 
        data: d.map(r => [r.timestamp * 1000, r.mem == null ? null : parseFloat(r.mem.toFixed(2))]), 
        color: COLORS.mem,
        connectNulls: connectVal
      }],
      yFormatter: v => v.toFixed(1) + '%',
      yMax: 100,
      colors: [COLORS.mem]
    })
  })

  const diskOption = computed(() => {
    const _dark = isDarkMode.value // 建立响应式依赖
    const d = metricsData.value
    if (!d || !d.length) return {}
    const connectVal = unref(isConnectNulls)
    return makeLineOption({
      series: [{ 
        name: '磁盘 %', 
        data: d.map(r => [r.timestamp * 1000, r.disk == null ? null : parseFloat(r.disk.toFixed(2))]), 
        color: COLORS.disk,
        connectNulls: connectVal
      }],
      yFormatter: v => v.toFixed(1) + '%',
      yMax: 100,
      colors: [COLORS.disk]
    })
  })

  const netOption = computed(() => {
    const _dark = isDarkMode.value // 建立响应式依赖
    const d = metricsData.value
    if (!d || !d.length) return {}
    const connectVal = unref(isConnectNulls)
    return makeLineOption({
      series: [
        { name: '↑ 发送', data: d.map(r => [r.timestamp * 1000, r.net_tx_speed == null ? null : r.net_tx_speed]), color: COLORS.tx, fill: false, connectNulls: connectVal },
        { name: '↓ 接收', data: d.map(r => [r.timestamp * 1000, r.net_rx_speed == null ? null : r.net_rx_speed]), color: COLORS.rx, fill: true, connectNulls: connectVal },
      ],
      yFormatter: v => formatSpeed(v),
      colors: [COLORS.tx, COLORS.rx]
    })
  })

  const connOption = computed(() => {
    const _dark = isDarkMode.value // 建立响应式依赖
    const d = metricsData.value
    if (!d || !d.length) return {}
    const connectVal = unref(isConnectNulls)
    return makeLineOption({
      series: [
        { name: 'TCP', data: d.map(r => [r.timestamp * 1000, r.tcp_conn == null ? null : r.tcp_conn]), color: COLORS.tcp, fill: false, connectNulls: connectVal },
        { name: 'UDP', data: d.map(r => [r.timestamp * 1000, r.udp_conn == null ? null : r.udp_conn]), color: COLORS.udp, fill: false, connectNulls: connectVal },
      ],
      yFormatter: v => String(Math.round(v)),
      colors: [COLORS.tcp, COLORS.udp]
    })
  })

  const procOption = computed(() => {
    const _dark = isDarkMode.value // 建立响应式依赖
    const d = metricsData.value
    if (!d || !d.length) return {}
    const connectVal = unref(isConnectNulls)
    return makeLineOption({
      series: [{ 
        name: '进程数', 
        data: d.map(r => [r.timestamp * 1000, r.processes == null ? null : r.processes]), 
        color: COLORS.proc,
        connectNulls: connectVal
      }],
      yFormatter: v => String(Math.round(v)),
      colors: [COLORS.proc]
    })
  })

  const pingSummaryData = computed(() => {
    if (!pingData.value) return []
    return pingData.value.map((task, index) => {
      const resolvedName = task.node_name || (task.rows && task.rows.length > 0 ? task.rows[0].node_name : '') || task.target || '监测节点'
      
      // 过滤出有有效延迟的数据样本
      const validRows = task.rows ? task.rows.filter(r => (r.ping_ms ?? r.latency_ms) != null) : []
      const count = validRows.length
      
      let avg = 0, min = 0, max = 0, p50 = 0, p99 = 0, loss = 0, jitter = 0
      
      if (count > 0) {
        // 提取延迟数组并排序用于计算分位数和极值
        const pings = validRows.map(r => r.ping_ms ?? r.latency_ms).sort((a, b) => a - b)
        min = pings[0]
        max = pings[count - 1]
        avg = pings.reduce((a, b) => a + b, 0) / count
        
        // 计算选定周期历史数据的 p50 和 p99 分位数
        p50 = pings[Math.floor(count * 0.5)]
        p99 = pings[Math.floor(count * 0.99)]
        
        // 丢包率与波动取该周期内最后一次上报的实时值
        const lastRow = validRows[count - 1]
        loss = lastRow.loss ?? 0
        jitter = lastRow.jitter ?? 0
      }
  
      return {
        target: task.target,
        nodeName: resolvedName,
        themeColor: PING_COLORS[index % PING_COLORS.length],
        latestMs: task.latestMs != null ? task.latestMs.toFixed(0) : '超时',
        avg: count > 0 ? avg.toFixed(1) : '-',
        min: count > 0 ? min.toFixed(1) : '-',
        max: count > 0 ? max.toFixed(1) : '-',
        p50: count > 0 ? p50.toFixed(1) : '-',
        p99: count > 0 ? p99.toFixed(1) : '-',
        loss: count > 0 ? loss.toFixed(1) : '100',
        jitter: count > 0 ? jitter.toFixed(1) : '-',
        samples: count
      }
    })
  })

  const mergedPingOption = computed(() => {
    const _dark = isDarkMode.value
    if (!pingData.value || pingData.value.length === 0) return {}
  
    const smoothVal = unref(isSmooth)
    const userSelected = unref(legendSelected)
  
    const series = pingData.value.map((task, index) => {
      const themeColor = PING_COLORS[index % PING_COLORS.length]
      const resolvedName = task.node_name || (task.rows && task.rows.length > 0 ? task.rows[0].node_name : '') || task.target || '延迟'
      const baseData = task.rows ? task.rows.map(r => [r.timestamp * 1000, (r.ping_ms ?? r.latency_ms) == null ? null : (r.ping_ms ?? r.latency_ms)]) : []

      const chartData = smoothVal ? calculateEWMA(baseData, 0.1) : baseData
      return {
        name: resolvedName,
        data: chartData,
        color: themeColor,
        smooth: false, 
        fill: false,
        connectNulls: false
      }
    })
  
    const colors = pingData.value.map((_, i) => PING_COLORS[i % PING_COLORS.length])
    
    const seriesNames = series.map(s => s.name)
    const finalSelected = {}
    let allHidden = true

    seriesNames.forEach(name => {
      finalSelected[name] = userSelected[name] !== false
      if (finalSelected[name]) {
        allHidden = false
      }
    })
  
    const baseOption = makeLineOption({
      series,
      yFormatter: v => v != null ? v.toFixed(0) + ' ms' : '',
      colors,
      showLegend: true,
      legendSelected: finalSelected
    })
    return baseOption
  })

  return { cpuOption, memOption, diskOption, netOption, connOption, procOption, pingSummaryData, mergedPingOption }
}