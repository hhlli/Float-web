import { defineStore } from 'pinia'
import request from '@/utils/request'

// 简单的语义化版本比较函数
function compareVersions(v1, v2) {
  if (!v1 || !v2) return false
  const p1 = v1.replace(/^v/, '').split('.').map(Number)
  const p2 = v2.replace(/^v/, '').split('.').map(Number)
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] || 0
    const num2 = p2[i] || 0
    if (num1 < num2) return true
    if (num1 > num2) return false
  }
  return false
}

export const useSiteStore = defineStore('site', {
  state: () => ({
    theme: 'default',
    themeConfig: {},
    settings: {},
    isFetched: false,
    hasUpdate: false
  }),
  actions: {
    async fetchSettings() {
      if (this.isFetched) return
      try {
        const data = await request.get('/api/public/settings')
        this.settings = data || {}
        this.theme = data?.theme || 'default'

        // 🌟 新增核心逻辑：安全解析透明透传的 JSON 字符串
        try {
          if (data?.theme_config) {
            this.themeConfig = JSON.parse(data.theme_config)
          } else {
            this.themeConfig = {} // 兜底空对象
          }
        } catch (parseError) {
          console.error('主题 JSON 配置解析失败，已重置为空对象', parseError)
          this.themeConfig = {}
        }
        
        // 计算是否有新版本
        const currentVersion = data?.server_version || ''
        const latestVersion = data?.latest_version || ''
        this.hasUpdate = compareVersions(currentVersion, latestVersion)
        
        this.isFetched = true
      } catch (e) {
        console.error('配置加载失败', e)
        this.theme = 'default'
      }
    }
  }
})