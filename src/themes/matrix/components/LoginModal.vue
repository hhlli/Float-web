<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="login-card">
          <div class="login-logo">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h3>{{ title }}</h3>
          <p class="login-subtitle">{{ subtitle }}</p>
          
          <template v-if="!need2FA">
            <div class="form-group">
              <label>ACCOUNT</label>
              <input type="text" v-model="loginForm.user" @keydown.enter="$refs.passInput.focus()" placeholder="请输入管理员账号">
            </div>
            <div class="form-group" style="margin-bottom: 20px;">
              <label>PASSWORD</label>
              <input type="password" v-model="loginForm.pass" ref="passInput" @keydown.enter="doLogin" placeholder="请输入密码">
            </div>
          </template>

          <template v-else>
            <div class="form-group" style="margin-bottom: 20px;">
              <label>SECURITY_CODE (2FA)</label>
              <input type="text" v-model="loginForm.code" ref="codeInput" @keydown.enter="doLogin" placeholder="000000" maxlength="6" class="code-input">
            </div>
          </template>
          
          <div v-if="errorMsg" class="error-text">
            [ ERROR: {{ errorMsg }} ]
          </div>

          <div class="login-actions">
            <button class="btn-outline" style="flex: 1;" @click="handleCancel">CANCEL</button>
            <button class="btn-primary" style="flex: 1; margin-left: 12px;" @click="doLogin" :disabled="isLoading">
              {{ isLoading ? 'PROCESSING...' : (need2FA ? 'VERIFY_LOGIN' : 'SIGN_IN') }}
            </button>
          </div>

          <template v-if="!need2FA">
            <div class="panel-divider">
              <span>OAUTH_ACCESS</span>
            </div>

            <div class="oauth-actions">
              <button class="btn-outline oauth-btn" @click="doOAuthLogin('github')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub
              </button>
              <button class="btn-outline oauth-btn" @click="doOAuthLogin('google')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
                </svg>
                Google
              </button>
            </div>
          </template>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request.js'
import { useAuthStore } from '@/store/auth.js'

const props = defineProps({ 
  show: Boolean,
  preventRedirect: { type: Boolean, default: false },
  title: { type: String, default: '系统登录' },
  subtitle: { type: String, default: '管理中枢身份验证' }
})
const emit = defineEmits(['close', 'success'])

const router = useRouter()
const authStore = useAuthStore()

const loginForm = ref({ user: 'admin', pass: '', code: '' })
const passInput = ref(null)
const codeInput = ref(null)
const errorMsg = ref('')
const isLoading = ref(false)
const need2FA = ref(false) 

const doLogin = async () => {
  if (!need2FA.value && (!loginForm.value.user || !loginForm.value.pass)) {
    errorMsg.value = "请输入账号和密码"
    return
  }
  if (need2FA.value && !loginForm.value.code) {
    errorMsg.value = "请输入 6 位动态验证码"
    return
  }

  errorMsg.value = ''
  isLoading.value = true

  try {
    const payload = {
      username: loginForm.value.user,
      password: loginForm.value.pass
    }
    if (need2FA.value) {
      payload.code = loginForm.value.code
    }

    const data = await request.post('/api/admin/login', payload)
    
    if (data && data.status === 'need_2fa') {
      need2FA.value = true
      errorMsg.value = ''
      nextTick(() => {
        if (codeInput.value) codeInput.value.focus()
      })
      return
    }

    if (data && data.token) {
      authStore.setToken(data.token)
      emit('success')
      emit('close')
      if (!props.preventRedirect) {
        router.push({ path: '/admin' })
      }
      resetForm()
    }
  } catch (e) {
    if (need2FA.value) {
      errorMsg.value = "验证码错误或已失效"
      loginForm.value.code = ''
      nextTick(() => {
        if (codeInput.value) codeInput.value.focus()
      })
    } else {
      errorMsg.value = "用户名或密码错误"
      loginForm.value.pass = '' 
    }
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  resetForm()
  emit('close')
}

const resetForm = () => {
  need2FA.value = false
  loginForm.value.pass = ''
  loginForm.value.code = ''
  errorMsg.value = ''
}

const doOAuthLogin = (provider) => {
  window.location.href = `/api/auth/${provider}/login`
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(2, 13, 26, 0.82);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.login-card {
  width: 340px;
  background: rgba(2, 14, 26, 0.96);
  border: 1px solid #00ff8820;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 32px rgba(0, 255, 136, 0.04);
}

.login-logo {
  text-align: center;
  color: #00ff8866;
  margin-bottom: 12px;
}

h3 {
  font-family: 'Courier New', monospace;
  font-size: 18px;
  font-weight: 700;
  color: #00ff88;
  margin: 0 0 6px;
  text-align: center;
  letter-spacing: 0.05em;
}

.login-subtitle {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #2a5a40;
  text-align: center;
  margin: 0 0 24px;
  letter-spacing: 0.08em;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.form-group label {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: #2a5a40;
  letter-spacing: 0.1em;
}

.form-group input {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  background: rgba(0, 255, 136, 0.03);
  border: 1px solid #00ff8822;
  border-radius: 4px;
  padding: 8px 12px;
  color: #a0ffcc;
  outline: none;
  transition: all 0.2s;
}

.form-group input:focus {
  border-color: #00ff8844;
  background: rgba(0, 255, 136, 0.06);
}

.form-group input::placeholder {
  color: #1a4a2a;
}

.code-input {
  text-align: center;
  letter-spacing: 6px !important;
  font-weight: bold;
  font-size: 16px !important;
  color: #00ff88 !important;
}

.error-text {
  font-family: 'Courier New', monospace;
  color: #ff4455;
  font-size: 11px;
  margin-bottom: 16px;
  text-align: center;
}

.login-actions {
  display: flex;
  justify-content: space-between;
}

button {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-outline {
  background: transparent;
  border: 1px solid #00ff8822;
  color: #3a7a55;
}

.btn-outline:hover {
  border-color: #00ff8844;
  color: #00ff88;
  background: rgba(0, 255, 136, 0.04);
}

.btn-primary {
  background: rgba(0, 255, 136, 0.08);
  border: 1px solid #00ff8844;
  color: #00ff88;
  font-weight: 600;
}

.btn-primary:hover:not(:disabled) {
  background: rgba(0, 255, 136, 0.12);
  border-color: #00ff8888;
}

.btn-primary:disabled {
  background: rgba(2, 14, 26, 0.5);
  border-color: #1a4a2a;
  color: #1a4a2a;
  cursor: not-allowed;
}

.panel-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0 14px;
  color: #2a5a40;
  font-size: 10px;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.08em;
}

.panel-divider::before, .panel-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px dashed #00ff8818;
}

.panel-divider span {
  padding: 0 10px;
}

.oauth-actions {
  display: flex;
  gap: 12px;
}

.oauth-btn {
  flex: 1;
  gap: 6px;
  color: #2a7a45;
}

.oauth-btn svg {
  color: currentColor;
}

.oauth-btn:hover {
  color: #a0ffcc;
}

/* Modal transition hooks matching project animation curves */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .login-card, .modal-fade-leave-active .login-card {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease;
}
.modal-fade-enter-from .login-card, .modal-fade-leave-to .login-card {
  transform: scale(0.96);
  opacity: 0;
}
</style>