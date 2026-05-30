import { defineStore } from 'pinia'
import request from '@/utils/request'

export const useSiteStore = defineStore('site', {
  state: () => ({
    theme: 'default',
    settings: {},
    isFetched: false
  }),
  actions: {
    async fetchSettings() {
      if (this.isFetched) return
      try {
        const data = await request.get('/api/public/settings')
        this.settings = data || {}
        this.theme = data?.theme || 'default' // 需服务端接口增加 theme 字段
        this.isFetched = true
      } catch (e) {
        console.error('配置加载失败', e)
        this.theme = 'default'
      }
    }
  }
})