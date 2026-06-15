import { defineStore } from 'pinia'
import request from '@/utils/request.js'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    config: null,
    isFetching: false
  }),
  actions: {
    async fetchSettings(force = false) {
      if ((this.config && !force) || this.isFetching) return
      this.isFetching = true
      try {
        this.config = await request.get('/api/admin/settings/get')
      } catch (e) {
        console.error('获取全局配置失败', e)
      } finally {
        this.isFetching = false
      }
    },
    async updateSettings(payload) {
      await request.post('/api/admin/settings/update', payload)
      await this.fetchSettings(true)
    }
  }
})