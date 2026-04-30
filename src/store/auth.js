import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // 初始值从 localStorage 获取，实现持久化
  const token = ref(localStorage.getItem('server_token') || '')

  // 是否已登录
  const isLoggedIn = () => !!token.value

  // 设置 Token
  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('server_token', newToken)
  }

  // 退出登录
  const logout = () => {
    token.value = ''
    localStorage.removeItem('server_token')
  }

  return { token, setToken, logout, isLoggedIn }
})