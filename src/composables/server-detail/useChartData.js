import { ref, computed, watch } from 'vue'
import { rangeToSeconds } from './chartUtils.js'

const padGaps = (dataArray) => {
  if (!dataArray || dataArray.length < 2) return dataArray
  let minInterval = Infinity
  const startIdx = Math.max(0, dataArray.length - 30)
  for (let i = startIdx; i < dataArray.length - 1; i++) {
    const diff = dataArray[i+1].timestamp - dataArray[i].timestamp
    if (diff > 0 && diff < minInterval) minInterval = diff
  }
  if (minInterval === Infinity) minInterval = 60 

  const threshold = minInterval * 2.5
  const padded = []
  for (let i = 0; i < dataArray.length; i++) {
    padded.push(dataArray[i])
    if (i < dataArray.length - 1) {
      const diff = dataArray[i+1].timestamp - dataArray[i].timestamp
      if (diff > threshold) {
        const midPoint = Math.floor((dataArray[i].timestamp + dataArray[i+1].timestamp) / 2)
        padded.push({ timestamp: midPoint }) 
      }
    }
  }
  return padded
}

export function useChartData(server) {
  const metricsData = ref([])
  const pingData    = ref([])
  const isLoading   = ref(false)
  const currentRange = ref('realtime')

  const hasData = computed(() => metricsData.value.length > 0 || pingData.value.some(task => task.rows && task.rows.length > 0))

  const currentCPU = computed(() => {
    if (!metricsData.value.length) return (server.value?.cpu || 0).toFixed(1)
    const validData = metricsData.value.filter(r => r.cpu != null)
    if (!validData.length) return '0.0'
    return (validData[validData.length - 1]?.cpu || 0).toFixed(1)
  })

  const fetchData = async (activeRange) => {
    if (!server.value?.node_id) return
    currentRange.value = activeRange
    isLoading.value = true

    try {
      const nodeID = server.value.node_id
      const [metricsRes, pingRes] = await Promise.all([
        fetch(`/api/data?node_id=${nodeID}&range=${activeRange}`),
        fetch(`/api/data/ping?node_id=${nodeID}&range=${activeRange}`)
      ])

      if (metricsRes.ok) metricsData.value = padGaps(await metricsRes.json() || [])
      if (pingRes.ok) pingData.value = buildPingData(await pingRes.json() || [])
    } catch (e) {
      console.error('fetchData error:', e)
    } finally {
      isLoading.value = false
    }
  }

  const reset = () => {
    metricsData.value = []
    pingData.value    = []
  }

  watch(() => server.value?.last_active, (newVal, oldVal) => {
    if (currentRange.value === 'realtime' && newVal && newVal !== oldVal) {
      const s = server.value
      metricsData.value.push({
        timestamp: s.last_active, cpu: s.cpu, mem: s.mem, disk: s.disk,
        net_rx_speed: s.net_rx_speed, net_tx_speed: s.net_tx_speed,
        net_rx_total: s.net_rx_total, net_tx_total: s.net_tx_total,
        tcp_conn: s.tcp_conn, udp_conn: s.udp_conn, processes: s.processes,
        load_1: s.load_1, load_5: s.load_5, load_15: s.load_15,
        swap_used: s.swap_used, swap_total: s.swap_total
      })
      const cutoff = (Date.now() / 1000) - rangeToSeconds['realtime']
      while (metricsData.value.length > 0 && metricsData.value[0].timestamp < cutoff) {
        metricsData.value.shift()
      }
    }
  })

  const startPoll = (rangeRef) => currentRange.value = rangeRef.value
  const stopPoll = () => {}

  return { metricsData, pingData, isLoading, hasData, currentCPU, fetchData, startPoll, stopPoll, reset }
}

function buildPingData(raw) {
  const grouped = {}
  for (const row of raw) {
    if (!grouped[row.target]) grouped[row.target] = []
    grouped[row.target].push(row)
  }
  return Object.entries(grouped).map(([target, rows]) => {
    const paddedRows = padGaps(rows)
    return {
      target, rows: paddedRows,
      latestMs: paddedRows.length ? (paddedRows[paddedRows.length - 1].ping_ms ?? paddedRows[paddedRows.length - 1].latency_ms) : null
    }
  })
}