<template>
  <div class="card">
    <div class="card-body">
      
      <div class="form-section">
        <h3 class="section-title">站点配置</h3>
        <div class="form-row">
          <div class="form-group flex-1">
            <label>站点名称</label>
            <input type="text" v-model="form.site_name" placeholder="输入站点名称" class="form-control">
          </div>
          <div class="form-group flex-1">
            <label>站点图标 (URL)</label>
            <input type="text" v-model="form.site_icon" placeholder="例如：/favicon.ico 或外部链接" class="form-control">
          </div>
        </div>
        <div class="form-group mb-16">
          <label>站点描述</label>
          <textarea v-model="form.site_desc" rows="2" placeholder="输入站点的SEO描述信息" class="form-control"></textarea>
        </div>
        <div class="form-group">
          <label>自定义底部内容 (HTML)</label>
          <textarea v-model="form.custom_footer" rows="3" placeholder="支持填写HTML代码，将在页面底部 <body> 区域渲染" class="form-control"></textarea>
        </div>
      </div>

      <div class="form-section">
        <h3 class="section-title">通信与安全</h3>
        
        <div class="form-group toggle-group mb-16">
          <div class="toggle-wrapper">
            <BaseToggle v-model="form.require_login" />
            <span class="toggle-label">开启隐私站点</span>
          </div>
          <span class="help-text block-help">未登录访客将被拦截，必须登录才可查看监控数据</span>
        </div>
        
        <div class="form-group">
          <label>Agent 连接地址</label>
          <input type="text" v-model="form.agent_url" placeholder="例如：https://api.example.com" class="form-control">
          <span class="help-text">为安装脚本定义面板的连接地址，留空则默认使用当前访问的域名。</span>
        </div>
      </div>

      <div class="action-row">
        <BaseSaveButton 
          :loading="isSubmitting" 
          text="更新站点设置" 
          @click="save" 
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import BaseToggle from '@/components/common/BaseToggle.vue'
import BaseSaveButton from '@/components/common/BaseSaveButton.vue'
import { showToast } from '@/utils/toast.js'

const props = defineProps({
  initialData: Object
})
const emit = defineEmits(['save'])

const form = ref({
  site_name: '',
  site_desc: '',
  site_icon: '',
  custom_footer: '',
  require_login: false,
  agent_url: ''
})

const isSubmitting = ref(false)

watch(() => props.initialData, (newVal) => {
  if (newVal) {
    form.value = {
      site_name: newVal.site_name || '',
      site_desc: newVal.site_desc || '',
      site_icon: newVal.site_icon || '',
      custom_footer: newVal.custom_footer || '',
      require_login: newVal.require_login === true || newVal.require_login === 'true' || newVal.require_login === 1 || newVal.require_login === '1',
      agent_url: newVal.agent_url || '' // <- server_token 已删除
    }
  }
}, { immediate: true })

const save = async () => {
  isSubmitting.value = true
  await emit('save', form.value)
  isSubmitting.value = false
  showToast('设置已保存', 'success')
}
</script>

<style scoped>
/* 栅格辅助类 */
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }
.mb-16 { margin-bottom: 16px; }

/* 开关组件布局 */
.toggle-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}
.toggle-label {
  font-size: 14px;
  color: var(--text-main);
  font-weight: 500;
}
.block-help {
  display: block;
  margin-top: 0;
}

/* 动作按钮行 */
.action-row {
  margin-top: 32px;
  display: flex;
  justify-content: flex-end;
}
</style>