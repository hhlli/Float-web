<template>
  <BaseModal 
    :show="show" 
    title="主题高级配置 (JSON)" 
    width="520px"
    @close="closeModal"
  >
    <div class="form-group">
      <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px; line-height: 1.5;">
        在此输入标准的 JSON 格式数据。后端不校验此数据结构，将直接透传给前端主题进行渲染，可用于存放多端同步的背景色、开关等自定义参数。
      </div>
      <textarea 
        v-model="configJsonStr" 
        class="form-control" 
        rows="10" 
        style="font-family: monospace; font-size: 13px; resize: vertical; line-height: 1.5; background: var(--bg-color);" 
        placeholder='{
  "darkMode": true,
  "themeColor": "#3b82f6"
}'></textarea>
    </div>
    
    <template #footer>
      <button class="btn-outline" @click="closeModal">取消</button>
      <button @click="saveThemeConfig" :disabled="isSaving" class="btn-primary">
        {{ isSaving ? '保存中...' : '校验并保存' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import request from '@/utils/request'
import { useSiteStore } from '@/store/site'
import { showToast } from '@/utils/toast.js'
import BaseModal from '@/components/common/BaseModal.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])
const siteStore = useSiteStore()

const configJsonStr = ref('')
const isSaving = ref(false)

watch(() => props.show, (newVal) => {
  if (newVal) {
    configJsonStr.value = Object.keys(siteStore.themeConfig || {}).length > 0
      ? JSON.stringify(siteStore.themeConfig, null, 2)
      : '{\n  \n}'
  }
})

const closeModal = () => {
  emit('close')
}

const saveThemeConfig = async () => {
  if (isSaving.value) return
  
  let parsedJson = null
  try {
    const strToParse = configJsonStr.value.trim() || '{}'
    parsedJson = JSON.parse(strToParse)
  } catch (e) {
    showToast('JSON 格式不合法，请检查语法错误 (如引号、逗号)', 'error')
    return
  }

  isSaving.value = true
  try {
    const finalString = JSON.stringify(parsedJson)
    await request.put('/api/admin/settings/update', {
      theme_config: finalString
    })
    
    siteStore.themeConfig = parsedJson
    showToast('主题配置数据持久化成功', 'success')
    closeModal()
  } catch (e) {
    showToast('配置保存失败，请检查网络', 'error')
  } finally {
    isSaving.value = false
  }
}
</script>