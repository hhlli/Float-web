import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '../utils/request'

export const useServerStore = defineStore('server', () => {
  const servers = ref([])
  const loading = ref(false)
  let timer = null // 用于轮询的定时器

  // 获取服务器列表
  const fetchServers = async () => {
    loading.value = true
    try {
      const data = await request.get('/api/admin/servers')
      servers.value = data || []
    } catch (e) {
      console.error('Fetch servers error:', e)
    } finally {
      loading.value = false
    }
  }

  // 🌟 开启实时更新 (轮询模式)
  const startPolling = (interval = 5000) => {
    if (timer) return
    fetchServers() // 先执行一次
    timer = setInterval(fetchServers, interval)
  }

  // 停止更新
  const stopPolling = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  return { servers, loading, fetchServers, startPolling, stopPolling }
})