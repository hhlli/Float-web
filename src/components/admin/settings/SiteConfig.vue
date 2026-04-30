<template>
  <div class="card fluid-card">
    <div class="card-header">站点全局配置</div>
    <div class="card-body">
      
      <div class="form-section">
        <h3 class="section-title">基本信息</h3>
        <div class="form-row">
          <div class="form-group" style="flex: 1;">
            <label>站点名称</label>
            <input type="text" v-model="form.site_name" placeholder="输入站点名称" class="form-control">
          </div>
          <div class="form-group" style="flex: 1;">
            <label>站点图标 (URL)</label>
            <input type="text" v-model="form.site_icon" placeholder="例如：/favicon.ico 或外部链接" class="form-control">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group" style="flex: 1;">
            <label>站点描述</label>
            <textarea v-model="form.site_desc" rows="2" placeholder="输入站点的SEO描述信息" class="form-control"></textarea>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3 class="section-title">显示与安全</h3>
        <div class="form-row">
          <div class="form-group" style="flex: 1;">
            <label>自定义底部内容 (HTML)</label>
            <textarea v-model="form.custom_footer" rows="3" placeholder="支持填写HTML代码，将在页面底部 <body> 区域渲染" class="form-control"></textarea>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.require_login">
              <span class="checkbox-text">开启隐私模式（未登录访客将被拦截，必须登录才可查看监控数据）</span>
            </label>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3 class="section-title">系统与通信</h3>
        <div class="form-row">
          <div class="form-group" style="flex: 2;">
            <label>通信密钥 (Server Token)</label>
            <input type="text" v-model="form.server_token" class="form-control">
            <span class="help-text">探针通信认证密钥，修改后需同步更新探针配置。</span>
          </div>
          <div class="form-group" style="flex: 1;">
            <label>数据保留天数</label>
            <input type="number" v-model="form.retention_days" class="form-control">
            <span class="help-text">过期监控数据将被清理</span>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group" style="flex: 1;">
            <label>Agent 连接地址</label>
            <input type="text" v-model="form.agent_url" placeholder="例如：https://api.example.com" class="form-control">
            <span class="help-text">为安装脚本定义面板的连接地址，留空则默认使用当前访问的域名。</span>
          </div>
        </div>
      </div>

      <div class="action-row" style="margin-top: 32px; display: flex; justify-content: flex-end;">
        <button class="btn-primary" @click="save" :disabled="isSubmitting">
          {{ isSubmitting ? '保存中...' : '更新站点设置' }}
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
          全局设置已成功更新
        </p>
      </div>
      <template #footer>
        <button class="btn-primary" @click="showSuccessModal = false">确定</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import BaseModal from '../../common/BaseModal.vue'

const props = defineProps({
  initialData: Object
})
const emit = defineEmits(['save'])

// 初始化表单结构
const form = ref({
  site_name: '',
  site_desc: '',
  site_icon: '',
  custom_footer: '',
  require_login: false,
  server_token: '',
  retention_days: 7,
  agent_url: ''
})

const isSubmitting = ref(false)
const showSuccessModal = ref(false) // 控制弹窗显示

// 监听并回显数据
watch(() => props.initialData, (newVal) => {
  if (newVal) {
    form.value = {
      site_name: newVal.site_name || '',
      site_desc: newVal.site_desc || '',
      site_icon: newVal.site_icon || '',
      custom_footer: newVal.custom_footer || '',
      require_login: !!newVal.require_login,
      server_token: newVal.server_token || '',
      retention_days: newVal.retention_days || 7,
      agent_url: newVal.agent_url || ''
    }
  }
}, { immediate: true })

const save = async () => {
  isSubmitting.value = true
  
  // 触发父组件的保存逻辑
  await emit('save', form.value)
  
  isSubmitting.value = false
  
  // 🌟 显示统一弹窗
  showSuccessModal.value = true
}
</script>

<style scoped>
.fluid-card { 
  width: 100%; 
}
.form-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}
.form-section:last-of-type {
  border-bottom: none;
}
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main, #1e293b);
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}
.form-group {
  display: flex;
  flex-direction: column;
}
.form-group label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 6px;
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
  background: var(--surface-color, #fff);
  color: var(--text-main);
}
.form-control:focus {
  border-color: var(--primary-color, #3b82f6);
}

.help-text {
  font-size: 12px;
  color: var(--text-muted, #94a3b8);
  margin-top: 4px;
}

.checkbox-group {
  display: flex;
  align-items: center;
  flex-direction: row; /* 覆盖上面的 column */
}
.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 8px;
  font-size: 14px;
  color: var(--text-main, #334155);
}

textarea.form-control {
  resize: vertical;
  font-family: inherit;
}

/* 成功图标样式 */
.success-icon-wrapper {
  width: 50px; 
  height: 50px; 
  border-radius: 50%; 
  background: #dcfce7;
  display: flex; 
  align-items: center; 
  justify-content: center; 
  margin: 0 auto;
}
.success-svg { 
  width: 24px; 
  height: 24px; 
  color: #16a34a; 
}
</style>