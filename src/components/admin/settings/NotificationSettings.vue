<template>
  <div class="card">
    <div class="card-body">

      <div class="form-section">
        <h3 class="section-title">通知设置</h3>
        <div class="form-group">
          <label>通知状态</label>
          <div class="toggle-row">
            <BaseToggle v-model="form.notify_enabled" />
            <span class="toggle-label">{{ form.notify_enabled ? '已启用系统告警通知' : '已关闭通知' }}</span>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3 class="section-title">通知渠道配置</h3>
        
        <div class="form-group select-group">
          <label>选择通知渠道</label>
          <BaseSelect 
            v-model="activeChannel" 
            :options="channelOptions" 
          />
        </div>

        <div v-show="activeChannel === 'telegram'" class="channel-panel">
          <div class="form-row">
            <div class="form-group" style="flex: 1;">
              <label>Telegram Bot Token</label>
              <input type="text" class="form-control" v-model="form.tg_bot_token" placeholder="例如: 123456:ABC-DEF1234...">
            </div>
            <div class="form-group" style="flex: 1;">
              <label>Chat ID</label>
              <input type="text" class="form-control" v-model="form.tg_chat_id" placeholder="接收通知的用户或群组 ID">
            </div>
          </div>
          <div class="form-group">
            <label>API 请求端点</label>
            <input type="text" class="form-control" v-model="form.tg_api_endpoint" placeholder="https://api.telegram.org/bot">
            <span class="help-text">默认使用官方端点，如需使用反向代理可在此修改。</span>
          </div>
        </div>

        <div v-show="activeChannel === 'bark'" class="channel-panel">
          <div class="form-group">
            <label>Bark 服务地址</label>
            <input type="text" class="form-control" v-model="form.bark_url" placeholder="https://api.day.app">
            <span class="help-text">留空将默认使用官方公用服务器。为了隐私安全，建议填写自建后端的地址。</span>
          </div>
          <div class="form-group">
            <label>Bark Key</label>
            <input type="text" class="form-control" v-model="form.bark_key" placeholder="例如: XXXXXXxxXXX">
            <span class="help-text">只要填写了合法的 Key，系统就会自动启用 Bark 推送。</span>
          </div>
        </div>

        <div v-show="activeChannel === 'email'" class="channel-panel">
          <div class="form-row">
            <div class="form-group" style="flex: 2;">
              <label>SMTP 服务器</label>
              <input type="text" class="form-control" v-model="form.email_smtp_host" placeholder="例如: smtp.gmail.com">
            </div>
            <div class="form-group" style="flex: 1;">
              <label>端口</label>
              <input type="text" class="form-control" v-model="form.email_smtp_port" placeholder="465 (SSL) 或 587">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="flex: 1;">
              <label>SMTP 用户名</label>
              <input type="text" class="form-control" v-model="form.email_username" placeholder="通常是发件邮箱地址">
            </div>
            <div class="form-group" style="flex: 1;">
              <label>SMTP 密码 / 授权码</label>
              <input type="password" class="form-control" v-model="form.email_password" placeholder="邮箱密码或应用专用密码">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="flex: 1;">
              <label>发件人邮箱 (From)</label>
              <input type="text" class="form-control" v-model="form.email_from" placeholder="noreply@domain.com">
            </div>
            <div class="form-group" style="flex: 1;">
              <label>收件人邮箱 (To)</label>
              <input type="text" class="form-control" v-model="form.email_to" placeholder="admin@domain.com">
            </div>
          </div>
        </div>

      </div>

      <div class="form-section">
        <h3 class="section-title">通知模板</h3>
        <div class="form-group">
          <label>离线告警模板</label>
          <textarea v-model="form.tpl_offline" rows="3" placeholder="🔴 服务器 {name} 已离线"></textarea>
          <span class="help-text">可用变量: {name} (节点名称) | {node_id} (节点ID) | {time} (发生时间)</span>
        </div>
        <div class="form-group">
          <label>恢复上线模板</label>
          <textarea v-model="form.tpl_online" rows="3" placeholder="🟢 服务器 {name} 已恢复上线"></textarea>
        </div>
      </div>

      <div class="action-row">
        <button class="btn-outline" @click="sendTest" :disabled="isTesting">
          {{ isTesting ? '测试发送中...' : `发送测试消息 (${activeChannel.toUpperCase()})` }}
        </button>
        
        <BaseSaveButton :loading="isSubmitting" text="保存所有设置" @click="save" />
      </div>

      <div v-if="testResult" :class="['test-result', testResult.ok ? 'success' : 'error']">
        {{ testResult.msg }}
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import BaseToggle from '@/components/common/BaseToggle.vue'
import BaseSaveButton from '@/components/common/BaseSaveButton.vue'
import BaseSelect from '@/components/common/BaseSelect.vue' // 导入通用下拉框
import request from '@/utils/request.js'

const props = defineProps({
  initialData: Object
})
const emit = defineEmits(['save'])

// 当前激活的选项
const activeChannel = ref('telegram')

// 下拉框可选项配置列表
const channelOptions = [
  { value: 'telegram', label: 'Telegram' },
  { value: 'bark', label: 'Bark (iOS)' },
  { value: 'email', label: 'Email (SMTP)' }
]

// 表单数据绑定
const form = ref({
  notify_enabled: false,
  
  // Telegram
  tg_bot_token: '', 
  tg_chat_id: '', 
  tg_api_endpoint: 'https://api.telegram.org/bot',
  
  // Bark
  bark_url: 'https://api.day.app', 
  bark_key: '',
  
  // Email
  email_smtp_host: '', 
  email_smtp_port: '465', 
  email_username: '', 
  email_password: '', 
  email_from: '', 
  email_to: '',
  
  // 模板
  tpl_offline: '🔴 服务器 {name} 已离线\n时间: {time}', 
  tpl_online: '🟢 服务器 {name} 已恢复上线\n时间: {time}'
})

const isSubmitting = ref(false)
const isTesting = ref(false)
const testResult = ref(null)

// 监听父组件传入的初始数据
watch(() => props.initialData, (newVal) => {
  if (newVal) {
    Object.keys(form.value).forEach(key => {
      if (newVal[key] !== undefined) {
        form.value[key] = newVal[key]
      }
    })
    form.value.notify_enabled = newVal.notify_enabled === 'true' || newVal.notify_enabled === true

    // 优化后的精准切换逻辑
    if (newVal.notify_active_channel) {
      activeChannel.value = newVal.notify_active_channel
    } else {
      // 兼容旧数据的兜底逻辑，必须严格判定非空字符串
      if (form.value.bark_key && form.value.bark_key.trim() !== '') {
        activeChannel.value = 'bark'
      } else if (form.value.email_smtp_host && form.value.email_smtp_host.trim() !== '') {
        activeChannel.value = 'email'
      } else {
        activeChannel.value = 'telegram'
      }
    }
  }
}, { immediate: true })

// 保存设置
const save = async () => {
  isSubmitting.value = true
  await emit('save', { 
    ...form.value, 
    notify_enabled: String(form.value.notify_enabled),
    notify_active_channel: activeChannel.value // 新增：保存当前选中的渠道到数据库
  })
  isSubmitting.value = false
}

// 发送测试消息
const sendTest = async () => {
  isTesting.value = true
  testResult.value = null
  
  try {
    const res = await request.post('/api/admin/notify/test', {
      channel: activeChannel.value,
      ...form.value
    })
    testResult.value = { 
      ok: true, 
      msg: res.msg || `✅ ${activeChannel.value.toUpperCase()} 测试消息发送成功，请检查对应客户端` 
    }
  } catch (err) {
    testResult.value = { 
      ok: false, 
      msg: `❌ 发送失败，请检查 ${activeChannel.value.toUpperCase()} 配置参数或网络连接` 
    }
  } finally {
    isTesting.value = false
  }
}
</script>

<style scoped>
.toggle-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
  flex-wrap: nowrap;     /* 强制 Flex 子元素保持在同一行 */
  overflow-x: auto;      /* 内容超出宽度时显示横向滚动条 */
  white-space: nowrap;   /* 禁止内部文本换行 */
}
.toggle-label {
  color: var(--text-muted);
  font-size: 14px;
}

/* 下拉选择框容器样式 */
.select-group {
  margin-bottom: 24px;
  max-width: 320px;
}
:deep(.select-trigger) {
  height: 38px !important;
  display: flex;
  align-items: center;
}

.channel-panel {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 按钮行与提示框 */
.action-row {
  display: flex; 
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
  padding-top: 0;
  border-top: none;
  flex-wrap: nowrap;     /* 强制 Flex 子元素保持在同一行 */
  overflow-x: auto;      /* 内容超出宽度时显示横向滚动条 */
  white-space: nowrap;   /* 禁止内部文本换行 */
}

.toggle-row > *, .action-row > * {
  flex-shrink: 0;
}

.test-result {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
}

.test-result.success {
  background: rgba(22, 163, 74, 0.1);
  color: #16a34a;
  border-color: rgba(22, 163, 74, 0.2);
}

.test-result.error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}
</style>