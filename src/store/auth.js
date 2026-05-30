import { defineStore } from 'pinia'
import { ref, computed } from 'vue' // 🌟 必须引入 computed

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('server_token') || '')

  // 🌟 修复：改为计算属性，确保组件能响应式侦听登录状态
  const isLoggedIn = computed(() => !!token.value)

  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('server_token', newToken)
  }

  const logout = () => {
    token.value = ''
    localStorage.removeItem('server_token')
  }

  return { token, setToken, logout, isLoggedIn }
})