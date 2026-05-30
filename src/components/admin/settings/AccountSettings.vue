<template>
  <div class="settings-wrapper">
    <div class="card">
      <div class="card-body">
        
        <div class="form-section">
          <h3 class="section-title">安全配置</h3>
          
          <div class="form-group">
            <label>管理员用户名</label>
            <input type="text" v-model="form.username" placeholder="修改用户名" class="form-control">
          </div>
          
          <div class="form-row">
            <div class="form-group flex-1">
              <label>新密码</label>
              <input type="password" v-model="form.password" placeholder="若不修改请留空" class="form-control">
              <span class="help-text">修改后下次登录需使用新密码</span>
            </div>
            
            <div class="form-group flex-1">
              <label>确认新密码</label>
              <input
                type="password"
                v-model="form.confirmPassword"
                placeholder="再次输入新密码"
                class="form-control"
                :class="{ 'input-error': passwordMismatch }"
              >
              <span class="help-text error-text" v-if="passwordMismatch">两次输入的密码不一致</span>
            </div>
          </div>

          <div class="form-group">
            <label>双重身份验证 (2FA)</label>
            <div class="status-row">
              <span>状态: <strong :class="{ 'text-success': form.tfa_enabled }">{{ form.tfa_enabled ? '已启用' : '未启用' }}</strong></span>
              <button class="btn-outline btn-sm" @click="openTFASetup">
                {{ form.tfa_enabled ? '重新设置' : '设置 2FA' }}
              </button>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title">单点登录 (SSO)</h3>
          
          <div class="form-row">
            <div class="form-group flex-1">
              <label>GitHub 单点登录</label>
              <div class="status-row">
                <span>状态: <strong>{{ form.github_id ? '已配置' : '未配置' }}</strong></span>
                <button class="btn-outline btn-sm" @click="showGitHubModal = true">配置 GitHub</button>
              </div>
            </div>

            <div class="form-group flex-1">
              <label>Google 单点登录</label>
              <div class="status-row">
                <span>状态: <strong>{{ form.google_id ? '已配置' : '未配置' }}</strong></span>
                <button class="btn-outline btn-sm" @click="showGoogleModal = true">配置 Google</button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="action-row">
          <button class="btn-primary" @click="save" :disabled="isSubmitting || passwordMismatch">
            {{ isSubmitting ? '保存中...' : '保存账户修改' }}
          </button>
        </div>
      </div>
    </div>

    <BaseModal :show="showTFAModal" title="设置双重身份验证" @close="showTFAModal = false">
      <div class="modal-inner-content">
        <p class="help-text-center">请使用身份验证应用扫描二维码</p>
        <div class="qr-placeholder">
          <img v-if="qrCodeImage" :src="qrCodeImage" alt="2FA QR Code" />
          <span v-else class="loading-text">加载中...</span>
        </div>
        <div class="form-group">
          <label>输入 6 位验证码</label>
          <input type="text" v-model="form.tfa_code" placeholder="000000" maxlength="6" class="code-input">
        </div>
      </div>
      <template #footer>
        <BaseSaveButton @click="saveTFA" />
      </template>
    </BaseModal>

    <BaseModal :show="showGitHubModal" title="GitHub OAuth 配置" @close="showGitHubModal = false">
      <div class="form-group">
        <label>Client ID</label>
        <input type="text" v-model="form.github_id" placeholder="输入 GitHub Client ID" class="form-control">
      </div>
      <div class="form-group">
        <label>Client Secret</label>
        <input type="password" v-model="form.github_secret" placeholder="输入 GitHub Client Secret" class="form-control">
      </div>
      <div class="form-group">
        <label>白名单用户 (逗号分隔)</label>
        <input type="text" v-model="form.github_whitelist" placeholder="例如: admin, user1" class="form-control">
      </div>
      <template #footer>
        <BaseSaveButton @click="saveGitHub" />
      </template>
    </BaseModal>

    <BaseModal :show="showGoogleModal" title="Google OAuth 配置" @close="showGoogleModal = false">
      <div class="form-group">
        <label>Client ID</label>
        <input type="text" v-model="form.google_id" placeholder="输入 Google Client ID" class="form-control">
      </div>
      <div class="form-group">
        <label>Client Secret</label>
        <input type="password" v-model="form.google_secret" placeholder="输入 Google Client Secret" class="form-control">
      </div>
      <div class="form-group">
        <label>允许的域名/邮箱 (逗号分隔)</label>
        <input type="text" v-model="form.google_whitelist" placeholder="例如: @example.com" class="form-control">
      </div>
      <template #footer>
        <BaseSaveButton @click="saveGoogle" />
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import request from '@/utils/request.js'
import QRCode from 'qrcode'
import { showToast } from '@/utils/toast.js'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseSaveButton from '@/components/common/BaseSaveButton.vue'

const props = defineProps({
  initialData: Object
})
const emit = defineEmits(['save'])

const form = ref({ 
  username: '', 
  password: '', 
  confirmPassword: '',
  tfa_enabled: false,
  tfa_code: '',
  github_id: '',
  github_secret: '',
  github_whitelist: '',
  google_id: '',
  google_secret: '',
  google_whitelist: ''
})

const isSubmitting = ref(false)
const showTFAModal = ref(false)
const showGitHubModal = ref(false)
const showGoogleModal = ref(false)
const qrCodeImage = ref('')

// 打开 2FA 设置并请求后端生成密钥
const openTFASetup = async () => {
  showTFAModal.value = true
  qrCodeImage.value = ''
  form.value.tfa_code = ''
  try {
    const res = await request.get('/api/admin/settings/2fa/generate')
    if (res && res.url) {
      qrCodeImage.value = await QRCode.toDataURL(res.url, { 
        width: 140, 
        margin: 1,
        color: { dark: '#1e293b', light: '#ffffff' }
      })
    }
  } catch (e) {
    console.error("2FA 初始化失败", e)
  }
}

const passwordMismatch = computed(() => {
  return form.value.confirmPassword !== '' && form.value.password !== form.value.confirmPassword
})

watch(() => props.initialData, (newVal) => {
  if (newVal) {
    form.value.username = newVal.admin_username || ''
    form.value.tfa_enabled = newVal.tfa_enabled === 'true'
    form.value.github_id = newVal.oauth_github_client_id || ''
    form.value.github_secret = newVal.oauth_github_client_secret || ''
    form.value.github_whitelist = newVal.oauth_github_whitelist || ''
    form.value.google_id = newVal.oauth_google_client_id || ''
    form.value.google_secret = newVal.oauth_google_client_secret || ''
    form.value.google_whitelist = newVal.oauth_google_whitelist || ''
  }
}, { immediate: true })

const save = async () => {
  if (form.value.password && form.value.password !== form.value.confirmPassword) return
  isSubmitting.value = true
  const payload = { admin_username: form.value.username }
  if (form.value.password) payload.admin_password = form.value.password
  await emit('save', payload)
  isSubmitting.value = false
  form.value.password = ''; form.value.confirmPassword = ''
}

const saveTFA = async () => {
  try {
    const res = await request.post('/api/admin/settings/2fa/verify', { 
      code: form.value.tfa_code 
    })
    
    if (res.status === 'success') {
      form.value.tfa_enabled = true
      showTFAModal.value = false
      showToast('2FA 双重身份验证已启用', 'success')
    }
  } catch (e) {
    showToast('验证码错误或已失效，请重试', 'error')
    form.value.tfa_code = '' // 清空错误的验证码
  }
}

const saveGitHub = async () => {
  await emit('save', {
    oauth_github_client_id: form.value.github_id,
    oauth_github_client_secret: form.value.github_secret,
    oauth_github_whitelist: form.value.github_whitelist
  })
  showGitHubModal.value = false
}

const saveGoogle = async () => {
  await emit('save', {
    oauth_google_client_id: form.value.google_id,
    oauth_google_client_secret: form.value.google_secret,
    oauth_google_whitelist: form.value.google_whitelist
  })
  showGoogleModal.value = false
}
</script>

<style scoped>
.settings-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-row {
  display: flex;
  gap: 16px;
}
.flex-1 { flex: 1; }

.form-group { margin-bottom: 16px; }
label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 8px; color: var(--text-muted); }


.help-text { display: block; font-size: 12px; color: var(--text-muted); margin-top: 6px; }
.input-error { border-color: #ef4444 !important; }
.error-text { color: #ef4444 !important; }

.status-row {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
}
.text-success { color: #10b981; }

.btn-sm { padding: 4px 12px; font-size: 13px; }

.action-row {
  margin-top: 32px;
  display: flex;
  justify-content: flex-end;
}

/* 弹窗专用样式 */
.modal-inner-content { text-align: center; }
.help-text-center { font-size: 14px; margin-bottom: 16px; color: var(--text-muted); }
.qr-placeholder {
  width: 140px;
  height: 140px;
  margin: 0 auto 20px;
  border: 1px solid var(--border-color);
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}
.qr-placeholder img { width: 120px; height: 120px; }
.loading-text { color: #94a3b8; font-size: 12px; }
.code-input {
  text-align: center;
  letter-spacing: 4px;
  font-weight: bold;
  font-size: 18px;
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}
</style>