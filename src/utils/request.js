import axios from 'axios'
import { useAuthStore } from '../store/auth.js' // 引入全局鉴权状态

const service = axios.create({
  baseURL: '', 
  timeout: 10000
})

service.interceptors.request.use(
  config => {
    // 必须在拦截器内部调用 useAuthStore，确保获取到最新的 Pinia 实例
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers['Authorization'] = 'Bearer ' + authStore.token
    }
    return config
  },
  error => {
    console.error('请求拦截器报错:', error)
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response) {
      if (error.response.status === 401) {
        console.error('Token 无效或已过期')
// 如果引入了 router，最好用 router.push('/login')，这里用最简单的原生跳转
localStorage.removeItem('server_token') // 双重保险
window.location.href = '/' // 🌟 解开这行注释，强行跳回登录页
} else {
console.error(`请求错误 ${error.response.status}:`, error.response.data || error.message)
}
}
    return Promise.reject(error)
  }
)

export default service