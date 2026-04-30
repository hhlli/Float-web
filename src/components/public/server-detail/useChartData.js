// src/components/public/server-detail/useChartData.js
import { ref, computed } from 'vue'
import { rangeToSeconds } from './chartUtils.js'

export function useChartData(server) {
  const metricsData = ref([])
  const pingData    = ref([])
  const isLoading   = ref(false)

  const hasData = computed(() =>
    metricsData.value.length > 0 || pingData.value.length > 0
  )

  const currentCPU = computed(() => {
    if (!metricsData.value.length) return (server.value?.cpu || 0).toFixed(1)
    return (metricsData.value[metricsData.value.length - 1]?.cpu || 0).toFixed(1)
  })

  let lastMetricTs = 0
  let lastPingTs   = 0
  let initialized  = false
  let currentRange = 'realtime' // 记录当前 range，供增量裁剪用

  const fetchData = async (activeRange) => {
    if (!server.value?.node_id) return

    const isRealtime = activeRange === 'realtime'
    const seconds    = rangeToSeconds[activeRange]
    const nodeID     = server.value.node_id
    currentRange     = activeRange

    // 全量拉取：首次加载 或 非实时模式
    if (!isRealtime || !initialized) {
      isLoading.value = true
      try {
        const [metricsRes, pingRes] = await Promise.all([
          // 🌟 修改：直接传递 activeRange 字符串
          fetch(`/api/data?node_id=${nodeID}&range=${activeRange}`),
          fetch(`/api/data/ping?node_id=${nodeID}&range=${activeRange}`)
        ])

        if (metricsRes.ok) {
          const data = await metricsRes.json() || []
          // ✅ 直接赋值，不裁剪，后端已按 range 返回正确时间窗口
          metricsData.value.splice(0, metricsData.value.length, ...data)
          lastMetricTs = data.length ? data[data.length - 1].timestamp : 0
        }

        if (pingRes.ok) {
          const raw = await pingRes.json() || []
          pingData.value = buildPingData(raw)
          lastPingTs = raw.length ? raw[raw.length - 1].timestamp : 0
        }

        initialized = true
      } catch (e) {
        console.error('fetchData error:', e)
      } finally {
        isLoading.value = false
      }
      return
    }

    // 实时增量拉取
    try {
      const [metricsRes, pingRes] = await Promise.all([
        // 🌟 修改：直接传递 activeRange 字符串
        fetch(`/api/data?node_id=${nodeID}&range=${activeRange}&after=${lastMetricTs}`),
        fetch(`/api/data/ping?node_id=${nodeID}&range=${activeRange}&after=${lastPingTs}`)
      ])

      if (metricsRes.ok) {
        const newRows = await metricsRes.json() || []
        if (newRows.length) {
          const merged = [...metricsData.value, ...newRows]
          // ✅ 只在实时增量时裁剪，用 rangeToSeconds[currentRange]
          const cutoff = Date.now() / 1000 - rangeToSeconds[currentRange]
          metricsData.value.splice(0, metricsData.value.length, ...merged.filter(r => r.timestamp >= cutoff))
          lastMetricTs = newRows[newRows.length - 1].timestamp
        }
      }

      if (pingRes.ok) {
        const newRaw = await pingRes.json() || []
        if (newRaw.length) {
          pingData.value = mergePingData(pingData.value, newRaw)
          lastPingTs = newRaw[newRaw.length - 1].timestamp
        }
      }
    } catch (e) {
      console.error('fetchData incremental error:', e)
    }
  }

  const reset = () => {
    metricsData.value = []
    pingData.value    = []
    lastMetricTs      = 0
    lastPingTs        = 0
    initialized       = false
    currentRange      = 'realtime'
  }

  let pollTimer = null

  const startPoll = (rangeRef) => {
    stopPoll()
    if (rangeRef.value === 'realtime') {
      pollTimer = setInterval(async () => {
        await fetchData(rangeRef.value)
      }, 5000)
    }
  }

  const stopPoll = () => {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  }

  return { metricsData, pingData, isLoading, hasData, currentCPU, fetchData, startPoll, stopPoll, reset }
}

function buildPingData(raw) {
  const grouped = {}
  for (const row of raw) {
    if (!grouped[row.target]) grouped[row.target] = []
    grouped[row.target].push(row)
  }
  return Object.entries(grouped).map(([target, rows]) => ({
    target,
    rows,
    latestMs: rows.length ? (rows[rows.length - 1].ping_ms ?? rows[rows.length - 1].latency_ms) : null
  }))
}

function mergePingData(existing, newRaw) {
  const map = {}
  for (const task of existing) map[task.target] = { ...task, rows: [...task.rows] }
  for (const row of newRaw) {
    if (!map[row.target]) map[row.target] = { target: row.target, rows: [], latestMs: null }
    map[row.target].rows.push(row)
    map[row.target].latestMs = row.ping_ms ?? row.latency_ms
  }
  return Object.values(map)
}