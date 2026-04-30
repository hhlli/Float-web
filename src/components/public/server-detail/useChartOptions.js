import { computed, unref } from 'vue'
import { makeLineOption, formatSpeed, formatBytes } from './chartUtils.js'

const PING_COLORS = ['#ef4444', '#10b981', '#8b5cf6', '#f59e0b', '#3b82f6', '#14b8a6']

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

const toLabels = (data) =>
  data.map(d => new Date(d.timestamp * 1000)
    .toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }))

export function useChartOptions(metricsData, pingData, isSmooth = false) {

  const cpuOption = computed(() => {
    const d = metricsData.value
    if (!d || !d.length) return {}
    return makeLineOption({
      labels: toLabels(d),
      series: [{ name: 'CPU %', data: d.map(r => parseFloat((r.cpu || 0).toFixed(2))), color: COLORS.cpu }],
      yFormatter: v => v.toFixed(1) + '%',
      //yMax: 100,
      colors: [COLORS.cpu]
    })
  })

  const memOption = computed(() => {
    const d = metricsData.value
    if (!d || !d.length) return {}
    return makeLineOption({
      labels: toLabels(d),
      series: [{ name: '内存 %', data: d.map(r => parseFloat((r.mem || 0).toFixed(2))), color: COLORS.mem }],
      yFormatter: v => v.toFixed(1) + '%',
      yMax: 100,
      colors: [COLORS.mem]
    })
  })

  const diskOption = computed(() => {
    const d = metricsData.value
    if (!d || !d.length) return {}
    return makeLineOption({
      labels: toLabels(d),
      series: [{ name: '磁盘 %', data: d.map(r => parseFloat((r.disk || 0).toFixed(2))), color: COLORS.disk }],
      yFormatter: v => v.toFixed(1) + '%',
      yMax: 100,
      colors: [COLORS.disk]
    })
  })

  const netOption = computed(() => {
    const d = metricsData.value
    if (!d || !d.length) return {}
    return makeLineOption({
      labels: toLabels(d),
      series: [
        { name: '↑ 发送', data: d.map(r => r.net_tx_speed || 0), color: COLORS.tx, fill: false },
        { name: '↓ 接收', data: d.map(r => r.net_rx_speed || 0), color: COLORS.rx, fill: true },
      ],
      yFormatter: v => formatSpeed(v),
      colors: [COLORS.tx, COLORS.rx]
    })
  })

  const connOption = computed(() => {
    const d = metricsData.value
    if (!d || !d.length) return {}
    return makeLineOption({
      labels: toLabels(d),
      series: [
        { name: 'TCP', data: d.map(r => r.tcp_conn || 0), color: COLORS.tcp, fill: false },
        { name: 'UDP', data: d.map(r => r.udp_conn || 0), color: COLORS.udp, fill: false },
      ],
      yFormatter: v => String(Math.round(v)),
      colors: [COLORS.tcp, COLORS.udp]
    })
  })

  const procOption = computed(() => {
    const d = metricsData.value
    if (!d || !d.length) return {}
    return makeLineOption({
      labels: toLabels(d),
      series: [{ name: '进程数', data: d.map(r => r.processes || 0), color: COLORS.proc }],
      yFormatter: v => String(Math.round(v)),
      colors: [COLORS.proc]
    })
  })

// 🌟 状态卡片数据
const pingSummaryData = computed(() => {
  if (!pingData.value) return []
  return pingData.value.map((task, index) => {
    // 从数据行内部提取 node_name
    const resolvedName = task.node_name || (task.rows && task.rows.length > 0 ? task.rows[0].node_name : '') || task.target || '监测节点'
    return {
      target: task.target,
      latestMs: task.latestMs,
      themeColor: PING_COLORS[index % PING_COLORS.length],
      nodeName: resolvedName,
    }
  })
})

// 🌟 合并图表数据
// 🌟 合并图表数据
const mergedPingOption = computed(() => {
  if (!pingData.value || pingData.value.length === 0) return {}

  const smoothVal = unref(isSmooth)

  const firstValidTask = pingData.value.find(t => t.rows && t.rows.length > 0)
  const labels = firstValidTask
    ? firstValidTask.rows.map(r => new Date(r.timestamp * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }))
    : []

  const series = pingData.value.map((task, index) => {
    const themeColor = PING_COLORS[index % PING_COLORS.length]
    const resolvedName = task.node_name || (task.rows && task.rows.length > 0 ? task.rows[0].node_name : '') || task.target || '延迟'
    return {
      name: resolvedName,
      // 兼容 ping_ms 与 latency_ms
      data: task.rows ? task.rows.map(r => r.ping_ms ?? r.latency_ms) : [],
      color: themeColor,
      smooth: smoothVal,
      fill: false 
    }
  })

  const colors = pingData.value.map((_, i) => PING_COLORS[i % PING_COLORS.length])

  return makeLineOption({
    labels: labels,
    series: series,
    yFormatter: v => v != null ? v.toFixed(0) + ' ms' : '',
    colors: colors,
    //yMax: 1000,
    showLegend: true 
  })
})

  return { cpuOption, memOption, diskOption, netOption, connOption, procOption, pingSummaryData, mergedPingOption }
}