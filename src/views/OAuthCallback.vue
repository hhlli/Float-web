<template>
  <div class="oauth-callback-container">
    <div class="spinner"></div>
    <p>{{ message }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const message = ref('正在验证登录状态...')

onMounted(() => {
  const token = route.query.token
  const error = route.query.error

  if (error) {
    message.value = `登录失败: ${decodeURIComponent(error)}`
    setTimeout(() => router.push('/'), 3000)
    return
  }

  if (token) {
    authStore.setToken(token)
    message.value = '登录成功，正在跳转...'
    setTimeout(() => router.push('/admin'), 1000)
  } else {
    message.value = '未获取到授权凭证'
    setTimeout(() => router.push('/'), 3000)
  }
})
</script>

<style scoped>
.oauth-callback-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-color);
  color: var(--text-main);
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>