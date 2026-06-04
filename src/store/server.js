import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'

export const useServerStore = defineStore('server', () => {
  const servers = ref([])
  const loading = ref(false)
  let ws = null
  let reconnectTimer = null
  let fetchDebounceTimer = null 
  let currentIsAdmin = false

  // 1. 获取基础静态与历史数据
  const fetchStaticServers = async (isAdmin = false) => {
    // 仅在首次无数据时显示全局 loading
    if (servers.value.length === 0) loading.value = true 
    try {
      const url = isAdmin ? '/api/admin/servers/static' : '/api/public/servers/static'
      const data = await request.get(url) || []
      
      if (servers.value.length === 0) {
        // 首次加载直接赋值
        servers.value = data
      } else {
        // 非首次加载：精准合并，保留原有内存引用，彻底消除闪烁
        const newIds = new Set(data.map(s => s.node_id))
        // 1. 剔除已被删除的节点
        servers.value = servers.value.filter(s => newIds.has(s.node_id))
        // 2. 更新或追加新节点
        data.forEach(newS => {
          const target = servers.value.find(s => s.node_id === newS.node_id)
          if (target) {
            // 仅更新静态字段，不覆盖 realtime 字段
            Object.assign(target, newS)
          } else {
            servers.value.push(newS)
          }
        })
      }
    } catch (e) {
      console.error('Fetch static servers error:', e)
    } finally {
      loading.value = false
    }
  }

  // 2. 获取初始的实时指标数据 (弥补 WebSocket 建立前的空窗期)
  const fetchRealtimeServers = async (isAdmin = false) => {
    try {
      const url = isAdmin ? '/api/admin/servers/realtime' : '/api/public/servers/realtime'
      const data = await request.get(url)
      if (data && Array.isArray(data)) {
        // 将实时指标合并到对应的静态节点对象上
        data.forEach(realtimeData => {
          const target = servers.value.find(s => s.node_id === realtimeData.node_id)
          if (target) {
            Object.assign(target, realtimeData)
          }
        })
      }
    } catch (e) {
      console.error('Fetch realtime servers error:', e)
    }
  }

  // 处理 WebSocket 推送的增量更新
  const handleWsMessage = (event) => {
    try {
      const diff = JSON.parse(event.data)
      if (diff && diff.node_id) {
        const target = servers.value.find(s => s.node_id === diff.node_id)
        if (target) {
          Object.assign(target, diff)
        } else {
          // 发现未知节点！触发防抖拉取机制
          if (fetchDebounceTimer) {
            clearTimeout(fetchDebounceTimer)
          }
          // 延迟 500ms，在此期间如果收到多个未知节点的数据包，只执行最后一次拉取
          fetchDebounceTimer = setTimeout(() => {
            fetchStaticServers(currentIsAdmin)
          }, 500)
        }
      }
    } catch (e) {
      console.error('Parse WS message error:', e)
    }
  }

  // 🌟 开启实时更新 (WebSocket 替换了原有的 setInterval)
  const startPolling = async (isAdmin = false) => {
    stopPolling() 
    currentIsAdmin = isAdmin // 记录当前状态，供 WebSocket 内部触发时使用
    
    await fetchStaticServers(isAdmin)
    await fetchRealtimeServers(isAdmin)
    connectWs()
  }

  // 建立并维护 WebSocket 连接
  const connectWs = () => {
    if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    // 连接到我们在后端写好的前端广播中心
    const wsUrl = `${protocol}//${host}/api/public/ws`

    ws = new WebSocket(wsUrl)

    ws.onmessage = handleWsMessage

    ws.onclose = () => {
      ws = null
      // 断线重连机制，避免网络波动导致数据停滞
      reconnectTimer = setTimeout(() => {
        connectWs()
      }, 3000)
    }

    ws.onerror = (e) => {
      console.error('WebSocket Error:', e)
    }
  }

  // 停止更新并断开连接 (例如离开监控页面时调用)
  const stopPolling = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (ws) {
      ws.onclose = null // 防止触发断线重连逻辑
      // 仅当连接已完全建立时才调用 close，避免抛出中止握手异常
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      } else if (ws.readyState === WebSocket.CONNECTING) {
        // 如果正在连接中，将其静默抛弃，交由浏览器后续回收，避免直接调用 close 抛错
        ws.onerror = null 
      }
      ws = null
    }
  }

  return { servers, loading, fetchStaticServers, fetchRealtimeServers, startPolling, stopPolling }
})