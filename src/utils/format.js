/**
 * 容量换算 (B/KB/MB/GB/TB)
 */
export const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  /**
   * 网速换算
   */
  export const formatSpeed = (bytes) => {
    return formatBytes(bytes) + '/s'
  }
  
  /**
   * 在线时间换算 (天/时/分)
   */
  export const formatUptime = (seconds) => {
    if (!seconds) return '0s'
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (d > 0) return `${d} day ${h} h ${m} min`
    return `${h} h ${m} min`
  }
  
  /**
   * 货币符号拼接
   */
  export const formatCurrency = (cost, currency) => {
    const symbols = { 'CNY': '¥', 'USD': '$', 'EUR': '€' }
    return `${symbols[currency] || ''}${cost}`
  }
  
  /**
   * 到期天数计算
   */
  export const calculateDaysLeft = (dateStr) => {
    if (!dateStr) return ''
    const target = new Date(dateStr).getTime()
    const now = new Date().getTime()
    const diff = target - now
    if (diff < 0) return '已过期'
    const days = Math.ceil(diff / (1000 * 3600 * 24))
    return `${days} day${days > 1 ? 's' : ''}`
  }
  
  /**
   * 判断是否在线
   */
  export const isOnline = (lastActive) => {
    if (!lastActive) return false
    return (Date.now() / 1000) - lastActive < 180
  }
  
  /**
   * 国家代码转 Emoji
   */
  export const getFlagEmoji = (countryCode) => {
    if (!countryCode || typeof countryCode !== 'string' || countryCode.trim().length !== 2) return '🌐'
    try {
      const code = countryCode.trim().toUpperCase()
      return String.fromCodePoint(...code.split('').map(char => 127397 + char.charCodeAt(0)))
    } catch (e) {
      return '🌐'
    }
  }
  
  /**
   * 操作系统名称标准化
   */
  export const formatOS = (osStr) => {
    if (!osStr) return 'Unknown'
    if (osStr.toLowerCase().includes('darwin')) return osStr.replace(/darwin/i, 'macOS')
    return osStr
  }
  
  /**
   * 操作系统图标映射匹配
   */
  export const getOsIcon = (osStr) => {
    if (!osStr) return '/icons.svg#os-linux'
    const lowerOs = osStr.toLowerCase()
    if (lowerOs.includes('ubuntu')) return '/icons.svg#os-ubuntu'
    if (lowerOs.includes('debian')) return '/icons.svg#os-debian'
    if (lowerOs.includes('centos')) return '/icons.svg#os-centos'
    if (lowerOs.includes('arch')) return '/icons.svg#os-arch'
    if (lowerOs.includes('alpine')) return '/icons.svg#os-alpine'
    if (lowerOs.includes('mac') || lowerOs.includes('darwin')) return '/icons.svg#os-apple'
    if (lowerOs.includes('win')) return '/icons.svg#os-windows'
    return '/icons.svg#os-linux' 
  }
  
  /**
   * 进度条阈值颜色计算
   */
  export function getProgressColor(percent) {
    const value = Number(percent) || 0;
    if (value >= 90) return '#ef4444'; // 极高负载：红色
    if (value >= 70) return '#f97316'; // 高负载：深橙色 (新增分段)
    if (value >= 50) return '#f59e0b'; // 中负载：黄橙色
    return '#10b981';                  // 低负载：绿色
  }
  
  /**
   * 流量百分比计算
   */
  export const getTrafficPercent = (server) => {
    if (!server.monthly_bw || server.monthly_bw <= 0) return 0
    const used = (server.net_tx_total || 0) + (server.net_rx_total || 0)
    const total = server.monthly_bw * 1024 * 1024 * 1024
    const p = (used / total) * 100
    return p > 100 ? 100 : p.toFixed(1)
  }