<template>
  <div class="webhook-settings-container">
    
    <div class="card" style="margin-bottom: 16px;">
      <div class="card-body">
        <h3 class="section-title">Telegram 交互凭证</h3>
        
        <div class="form-row">
          <div class="form-group" style="flex: 1;">
            <label>Webhook Bot Token</label>
            <input 
              type="text" 
              class="form-control"
              v-model="localData.tg_webhook_token" 
              :placeholder="initialData.tg_bot_token ? `复用通知 Bot: ${maskString(initialData.tg_bot_token)}` : '请输入独立的 Bot Token'"
            >
            <span class="help-text">配置用于接收外部查询指令（如 /status）的专属 Bot。若留空，系统将自动回退使用通知设置中的 Bot 凭证。</span>
          </div>

          <div class="form-group" style="flex: 1;">
            <label>允许交互的 Chat ID (白名单)</label>
            <input 
              type="text" 
              class="form-control"
              v-model="localData.tg_webhook_chat_id" 
              :placeholder="initialData.tg_chat_id ? `复用通知 Chat ID: ${initialData.tg_chat_id}` : '请输入授权的 Telegram Chat ID'"
            >
          </div>
        </div>

        <div class="action-row">
          <BaseSaveButton :loading="isSaving" text="保存凭证设置" @click="handleSave" />
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <h3 class="section-title">Webhook 状态管理</h3>
        
        <div class="form-group">
          <label>当前识别的回调域名</label>
          <input 
            type="text" 
            class="form-control" 
            :value="currentOrigin + '/api/telegram/webhook'" 
            readonly
            style="background-color: var(--bg-main, #f8f9fa); cursor: default;"
          >
          <span class="help-text">将上述地址注册至 Telegram 服务器，激活双向主动交互流。若面板域名发生变更，请重新进行绑定操作。</span>
        </div>

        <div class="action-row">
          <button 
            class="btn-outline" 
            style="color: #ef4444; border-color: rgba(239, 68, 68, 0.4);" 
            @click="manageWebhook('unbind')" 
            :disabled="isOperating"
          >
            解绑 Webhook
          </button>
          
          <button 
            class="btn-outline" 
            @click="manageWebhook('bind')" 
            :disabled="isOperating"
          >
            {{ isOperating ? '请求中...' : '绑定当前域名' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import request from '@/utils/request.js'
import { showToast } from '@/utils/toast.js'
import BaseSaveButton from '@/components/common/BaseSaveButton.vue'

const props = defineProps({
  initialData: {
    type: Object,
    required: true,
    default: () => ({})
  }
})

const emit = defineEmits(['save'])

const isSaving = ref(false)
const isOperating = ref(false)

const localData = ref({
  tg_webhook_token: props.initialData.tg_webhook_token || '',
  tg_webhook_chat_id: props.initialData.tg_webhook_chat_id || ''
})

const currentOrigin = computed(() => window.location.origin)

watch(() => props.initialData, (newVal) => {
  localData.value.tg_webhook_token = newVal.tg_webhook_token || ''
  localData.value.tg_webhook_chat_id = newVal.tg_webhook_chat_id || ''
}, { deep: true })

const maskString = (str) => {
  if (!str || str.length < 10) return str
  return str.slice(0, 6) + '...' + str.slice(-6)
}

const handleSave = async () => {
  isSaving.value = true
  try {
    await emit('save', localData.value)
  } finally {
    isSaving.value = false
  }
}

const manageWebhook = async (action) => {
  // 拦截逻辑：校验当前输入框数据是否与初始加载的数据库数据一致
  const isDataChanged = 
    localData.value.tg_webhook_token !== (props.initialData.tg_webhook_token || '') ||
    localData.value.tg_webhook_chat_id !== (props.initialData.tg_webhook_chat_id || '')

  if (isDataChanged) {
    showToast('凭证已修改，请先点击【保存所有设置】将数据入库，再执行绑定操作。', 'error')
    return
  }

  isOperating.value = true
  try {
    await request.post('/api/admin/settings/tg/webhook', {
      domain: currentOrigin.value,
      action: action
    })
    showToast(action === 'bind' ? 'Telegram Webhook 绑定成功' : 'Webhook 已成功解除绑定', 'success')
  } catch (err) {
    console.error(err)
    showToast('Webhook 操作失败，请检查后端配置', 'error')
  } finally {
    isOperating.value = false
  }
}
</script>

<style scoped>
/* 同步补充通知设置中的局部排版样式 */
.action-row {
  display: flex; 
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
  padding-top: 0;
  border-top: none;
  flex-wrap: nowrap;     
  overflow-x: auto;      
  white-space: nowrap;   
}

.action-row > * {
  flex-shrink: 0;
}
</style>