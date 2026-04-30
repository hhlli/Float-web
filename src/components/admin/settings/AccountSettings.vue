<template>
  <div class="card fluid-card">
    <div class="card-header">账户安全配置</div>
    <div class="card-body">
      <div class="form-group">
        <label>管理员用户名</label>
        <input type="text" v-model="form.username" placeholder="修改用户名" class="form-control">
      </div>
      
      <div class="form-group">
        <label>新密码</label>
        <input type="password" v-model="form.password" placeholder="若不修改请留空" class="form-control">
        <span class="help-text">修改后下次登录需使用新密码</span>
      </div>
      
      <div class="form-group">
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
      
      <div class="action-row" style="margin-top: 32px; display: flex; justify-content: flex-end;">
        <button class="btn-primary" @click="save" :disabled="isSubmitting || passwordMismatch">
          {{ isSubmitting ? '保存中...' : '保存账户修改' }}
        </button>
      </div>
    </div>

    <BaseModal :show="showSuccessModal" title="操作成功" @close="showSuccessModal = false">
      <div style="text-align: center; padding: 10px 0;">
        <div class="success-icon-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="success-svg">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <p style="margin-top: 16px; color: var(--text-main); font-size: 15px; font-weight: 500;">
          设置已成功更新
        </p>
      </div>
      <template #footer>
        <button class="btn-primary" @click="showSuccessModal = false">确定</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import BaseModal from '../../common/BaseModal.vue'

const props = defineProps({
  initialData: Object
})
const emit = defineEmits(['save'])

const form = ref({ username: '', password: '', confirmPassword: '' })
const isSubmitting = ref(false)
const showSuccessModal = ref(false) // 控制成功弹窗显示

const passwordMismatch = computed(() => {
  return form.value.confirmPassword !== '' && form.value.password !== form.value.confirmPassword
})

watch(() => props.initialData, (newVal) => {
  if (newVal) {
    form.value.username = newVal.admin_username || ''
  }
}, { immediate: true })

const save = async () => {
  if (form.value.password && form.value.password !== form.value.confirmPassword) return
  isSubmitting.value = true
  
  const payload = { admin_username: form.value.username }
  if (form.value.password) {
    payload.admin_password = form.value.password
  }
  
  // 触发父组件保存逻辑 (假设父组件的保存是异步且成功的)
  await emit('save', payload)
  
  isSubmitting.value = false
  form.value.password = ''
  form.value.confirmPassword = ''
  
  // 🌟 显示统一的成功提示弹窗
  showSuccessModal.value = true
}
</script>

<style scoped>
.fluid-card { width: 100%; }

.form-group {
  margin-bottom: 16px;
  text-align: left;
}
.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}
.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 6px;
  box-sizing: border-box;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.form-control:focus {
  border-color: var(--primary-color, #3b82f6);
}

.help-text {
  font-size: 12px;
  color: var(--text-muted, #94a3b8);
  margin-top: 4px;
  display: block;
}

.input-error {
  border-color: var(--danger, #ef4444) !important;
}
.error-text {
  color: var(--danger, #ef4444) !important;
}

/* 成功图标样式 */
.success-icon-wrapper {
  width: 50px; 
  height: 50px; 
  border-radius: 50%; 
  background: #dcfce7; /* 浅绿色背景 */
  display: flex; 
  align-items: center; 
  justify-content: center; 
  margin: 0 auto;
}
.success-svg { 
  width: 24px; 
  height: 24px; 
  color: #16a34a; /* 深绿色图标 */
}
</style>