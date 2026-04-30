<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="login-card">
          <div class="login-logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h3>系统登录</h3>
          <p class="login-subtitle">管理中枢身份验证</p>
          
          <div class="form-group">
            <label>账号</label>
            <input type="text" v-model="loginForm.user" @keydown.enter="$refs.passInput.focus()" placeholder="请输入管理员账号">
          </div>
          <div class="form-group" style="margin-bottom: 16px;">
            <label>密码</label>
            <input type="password" v-model="loginForm.pass" ref="passInput" @keydown.enter="doLogin" placeholder="请输入密码">
          </div>
          
          <div v-if="errorMsg" style="color: var(--danger-text, #ef4444); font-size: 13px; margin-bottom: 16px; text-align: center;">
            {{ errorMsg }}
          </div>

          <div class="login-actions">
            <button class="btn-outline" style="flex: 1;" @click="$emit('close')">取消</button>
            <button class="btn-primary" style="flex: 1; margin-left: 12px;" @click="doLogin" :disabled="isLoading">
              {{ isLoading ? '登录中...' : '登录' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
// 🌟 引入我们封装好的 request 工具和 Pinia Store
import request from '../../utils/request.js'
import { useAuthStore } from '../../store/auth.js'

defineProps({ show: Boolean })
const emit = defineEmits(['close'])

const router = useRouter()
const authStore = useAuthStore() // 🌟 实例化 Store

const loginForm = ref({ user: 'admin', pass: '' })
const passInput = ref(null)
const errorMsg = ref('')
const isLoading = ref(false)

const doLogin = async () => {
  if (!loginForm.value.user || !loginForm.value.pass) {
    errorMsg.value = "请输入账号和密码"
    return
  }

  errorMsg.value = ''
  isLoading.value = true

  try {
    // 🌟 1. 彻底抛弃原生 fetch，使用 request.post
    const data = await request.post('/api/admin/login', {
      username: loginForm.value.user,
      password: loginForm.value.pass
    })
    
    if (data && data.token) {
      // 🌟 2. 核心修复：通过 Store 写入 Token！
      // 这会同时触发 localStorage 保存，并更新全网状态，防止 401 踢出死循环
      authStore.setToken(data.token)
      
      emit('close')
      router.push({ path: '/admin' })
    }
  } catch (e) {
    // 拦截器如果判断是 /api/admin/login 抛出的 401，这里就能顺利捕获
    errorMsg.value = "用户名或密码错误"
    loginForm.value.pass = '' 
    console.error("登录异常:", e)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* 如果有专属样式保留在这里 */
</style>