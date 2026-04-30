<template>
  <div class="card fluid-card">
    <div class="card-header">通知设置</div>
    <div class="card-body">

      <!-- 通知总开关 -->
      <div class="form-group">
        <label>通知状态</label>
        <div class="toggle-row">
          <label class="toggle-switch">
            <input type="checkbox" v-model="form.notify_enabled">
            <span class="toggle-slider"></span>
          </label>
          <span class="toggle-label">{{ form.notify_enabled ? '已启用通知' : '已关闭通知' }}</span>
        </div>
      </div>
      

      <div class="divider"></div>

      <!-- 通知渠道 -->
      <h4 style="margin-bottom: 16px; color: var(--text-main);">通知渠道</h4>
      <div class="channel-tabs">
        <div class="channel-tab active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.48 13.802l-2.95-.924c-.64-.203-.653-.64.136-.953l11.57-4.461c.537-.194 1.006.131.326.784z"/></svg>
          Telegram
        </div>
      </div>

      <!-- TG 配置 -->
      <div class="form-row" style="margin-top: 16px;">
        <div class="form-group" style="flex: 1;">
          <label>Telegram Bot Token <span class="required">*</span></label>
          <input type="text" v-model="form.tg_bot_token" placeholder="例如: 123456:ABC-DEF1234...">
        </div>
        <div class="form-group" style="flex: 1;">
          <label>Chat ID <span class="required">*</span></label>
          <input type="text" v-model="form.tg_chat_id" placeholder="接收通知的用户或群组 ID">
        </div>
      </div>
      <div class="form-group">
        <label>请求端点</label>
        <input type="text" v-model="form.tg_api_endpoint" placeholder="https://api.telegram.org/bot">
        <span class="help-text">默认使用官方端点，如需代理可在此修改</span>
      </div>

      <div class="divider"></div>

      <!-- 通知模板 -->
      <h4 style="margin-bottom: 16px; color: var(--text-main);">通知模板</h4>
      <div class="form-group">
        <label>离线通知模板</label>
        <textarea v-model="form.tpl_offline" rows="3" placeholder="服务器 {name} 已离线，时间: {time}"></textarea>
        <span class="help-text">可用变量: {name} {node_id} {time}</span>
      </div>
      <div class="form-group">
        <label>恢复上线模板</label>
        <textarea v-model="form.tpl_online" rows="3" placeholder="服务器 {name} 已恢复上线，时间: {time}"></textarea>
      </div>

      <!-- 操作按钮 -->
      <div class="action-row">
        <button class="btn-outline" @click="sendTest" :disabled="isTesting || !form.tg_bot_token || !form.tg_chat_id">
          {{ isTesting ? '发送中...' : '发送测试消息' }}
        </button>
        <button class="btn-primary" @click="save" :disabled="isSubmitting">
          {{ isSubmitting ? '保存中...' : '保存通知设置' }}
        </button>
      </div>

      <div v-if="testResult" :class="['test-result', testResult.ok ? 'success' : 'error']">
        {{ testResult.msg }}
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  initialData: Object
})
const emit = defineEmits(['save'])

const form = ref({
  notify_enabled: false,
  tg_bot_token: '',
  tg_chat_id: '',
  tg_api_endpoint: 'https://api.telegram.org/bot',
  tpl_offline: '🔴 服务器 {name} 已离线\n时间: {time}',
  tpl_online: '🟢 服务器 {name} 已恢复上线\n时间: {time}'
})

const isSubmitting = ref(false)
const isTesting = ref(false)
const testResult = ref(null)

watch(() => props.initialData, (newVal) => {
  if (newVal) {
    form.value = {
      notify_enabled: newVal.notify_enabled === 'true' || newVal.notify_enabled === true,
      tg_bot_token: newVal.tg_bot_token || '',
      tg_chat_id: newVal.tg_chat_id || '',
      tg_api_endpoint: newVal.tg_api_endpoint || 'https://api.telegram.org/bot',
      tpl_offline: newVal.tpl_offline || '🔴 服务器 {name} 已离线\n时间: {time}',
      tpl_online: newVal.tpl_online || '🟢 服务器 {name} 已恢复上线\n时间: {time}'
    }
  }
}, { immediate: true })

const save = async () => {
  isSubmitting.value = true
  await emit('save', {
    ...form.value,
    notify_enabled: String(form.value.notify_enabled)
  })
  isSubmitting.value = false
}

const sendTest = async () => {
  isTesting.value = true
  testResult.value = null
  const token = localStorage.getItem('server_token')
  try {
    const res = await fetch('/api/admin/notify/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        tg_bot_token: form.value.tg_bot_token,
        tg_chat_id: form.value.tg_chat_id,
        tg_api_endpoint: form.value.tg_api_endpoint
      })
    })
    if (res.ok) {
      testResult.value = { ok: true, msg: '✅ 测试消息发送成功，请检查 Telegram' }
    } else {
      testResult.value = { ok: false, msg: '❌ 发送失败，请检查 Token 和 Chat ID' }
    }
  } catch {
    testResult.value = { ok: false, msg: '❌ 请求出错，请检查网络连接' }
  }
  isTesting.value = false
}
</script>

<style scoped>
.fluid-card { width: 100%; }

.toggle-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
}
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: var(--border-color, #3a3a4a);
  border-radius: 24px;
  transition: 0.3s;
}
.toggle-slider:before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  bottom: 3px;
  background: white;
  border-radius: 50%;
  transition: 0.3s;
}
input:checked + .toggle-slider { background: var(--accent, #7c6af7); }
input:checked + .toggle-slider:before { transform: translateX(20px); }
.toggle-label { color: var(--text-muted); font-size: 14px; }

.channel-tabs {
  display: flex;
  gap: 8px;
}
.channel-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--border-color, #3a3a4a);
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
}
.channel-tab.active {
  border-color: var(--accent, #7c6af7);
  color: var(--accent, #7c6af7);
  background: color-mix(in srgb, var(--accent, #7c6af7) 10%, transparent);
}

textarea {
  width: 100%;
  background: var(--bg-color, #f8fafc); /* 移除写死的黑色，使用全局背景色变量 */
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 6px;
  color: var(--text-main, #1e293b);
  padding: 10px 12px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
textarea:focus {
  outline: none;
  border-color: var(--primary-color, #3b82f6); /* 匹配全局焦点颜色 */
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.required { color: var(--danger, #e74c3c); }

.test-result {
  margin-top: 16px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
}
.test-result.success {
  background: color-mix(in srgb, #2ecc71 10%, transparent);
  color: #2ecc71;
  border: 1px solid #2ecc71;
}
.test-result.error {
  background: color-mix(in srgb, var(--danger, #e74c3c) 10%, transparent);
  color: var(--danger, #e74c3c);
  border: 1px solid var(--danger, #e74c3c);
}

.action-row { 
  display: flex; 
  justify-content: flex-end; /* 将按钮组整体右对齐 */
  gap: 12px;                 /* 按钮之间的间距 */
  margin-top: 32px;
}
</style>
