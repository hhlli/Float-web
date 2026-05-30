import { useServerStore } from '@/store/server' // 引入 store

export const isOnline = (s, onlineThreshold) => {
  if (!s.last_active) return false
  return (Date.now() / 1000 - s.last_active) < onlineThreshold
}

const getDynamicCurveness = (index) => {
  const base = 0.1 + (index % 6) * 0.05
  return base * (index % 2 === 0 ? 1 : -1)
}

export const buildMapOption = (props) => {
  const serverStore = useServerStore() // 实例化 store
  const serverCenter = [props.serverLon, props.serverLat]

  const scatterData = props.servers.map(s => {
    const online = isOnline(s, props.onlineThreshold)
    return {
      name: s.name,
      value: [s.longitude, s.latitude, online ? 1 : 0],
      node_id: s.node_id, // 只存完整重绘不需要的标识符
      itemStyle: {
        color: online ? '#00ff88' : '#ff4455',
        shadowBlur: online ? 12 : 6,
        shadowColor: online ? '#00ff8888' : '#ff445566',
      }
    }
  })

  const linesData = props.servers.map((s, index) => {
    const online = isOnline(s, props.onlineThreshold)
    return {
      coords: [[s.longitude, s.latitude], serverCenter],
      lineStyle: {
        color: online ? '#00ff8844' : '#ff445533',
        width: online ? 1 : 0.5,
        curveness: getDynamicCurveness(index)
      }
    }
  })

  const effectData = props.servers
    .map((s, index) => ({ s, index }))
    .filter(item => isOnline(item.s, props.onlineThreshold))
    .map(item => ({
      coords: [[item.s.longitude, item.s.latitude], serverCenter],
      lineStyle: { curveness: getDynamicCurveness(item.index) }
    }))

  return {
    backgroundColor: 'transparent',
    geo: {
      map: 'world',
      roam: true,
      zoom: 1.2,
      center: [20, 20],
      scaleLimit: { min: 1, max: 8 },
      itemStyle: { areaColor: '#0a1628', borderColor: '#0d3d2a', borderWidth: 0.5 },
      emphasis: { itemStyle: { areaColor: '#0d2040' }, label: { show: false } },
      label: { show: false },
      silent: false,
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(2, 13, 26, 0.95)',
      borderColor: '#00ff8833',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: { color: '#a0ffcc', fontSize: 12, fontFamily: 'monospace' },
      formatter: (params) => {
        const nodeId = params.data?.node_id
        if (!nodeId) return ''
        
        // 核心优化：动态从全局响应式 Store 中抓取最新 CPU/内存，不走 ECharts 重绘流程
        const s = serverStore.servers.find(item => item.node_id === nodeId)
        if (!s) return ''
        
        const online = isOnline(s, props.onlineThreshold)
        const statusColor = online ? '#00ff88' : '#ff4455'
        return `
          <div style="font-family:monospace;line-height:1.8">
            <div style="color:#00ff88;font-weight:700;margin-bottom:4px">${s.name}</div>
            <div style="color:${statusColor}">● ${online ? 'ONLINE' : 'OFFLINE'}</div>
            <div style="color:#4a90e2">IP: ${s.ipv4 || 'N/A'}</div>
            <div>CPU: ${(s.cpu || 0).toFixed(1)}%</div>
            <div>MEM: ${(s.mem || 0).toFixed(1)}%</div>
          </div>
        `
      }
    },
    series: [
      { type: 'lines', coordinateSystem: 'geo', data: linesData, polyline: false, lineStyle: { opacity: 0.6 }, zlevel: 1 },
      { type: 'lines', coordinateSystem: 'geo', data: effectData, polyline: false, silent: true, effect: { show: true, period: 4, trailLength: 0.3, symbol: 'circle', symbolSize: 3, color: '#00ff88' }, lineStyle: { width: 0, opacity: 0 }, zlevel: 2 },
      { type: 'effectScatter', coordinateSystem: 'geo', data: [{ value: serverCenter, name: 'SERVER' }], symbolSize: 10, itemStyle: { color: '#00d4ff' }, rippleEffect: { brushType: 'stroke', color: '#00d4ff', period: 2, scale: 4 }, zlevel: 3, silent: true },
      { type: 'effectScatter', coordinateSystem: 'geo', data: scatterData, symbolSize: 7, rippleEffect: { brushType: 'stroke', period: 3, scale: 3 }, zlevel: 4 },
    ]
  }
}