<template>
  <div class="rule-section">
    
    <div class="form-row rule-form-row">
      <div class="form-group toggle-group">
        <label>通知状态</label>
        <div class="toggle-wrapper">
          <BaseToggle v-model="expiryRule.enabled" />
          <span class="toggle-label">{{ expiryRule.enabled ? '已启用过期提醒' : '已关闭过期提醒' }}</span>
        </div>
      </div>
      
      <BaseNumberGroup v-model="expiryRule.days_before" label="提前提醒天数" width="200px" min="1" placeholder="7" />
    </div>

    <div class="action-row">
      <BaseSaveButton :loading="isSaving" @click="saveData" />
    </div>
    
  </div>
</template>

<script setup>
import { ref, watchEffect } from 'vue'
import { showToast } from '@/utils/toast.js'
import { useSettingsStore } from '@/store/settings.js'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseNumberGroup from '@/components/common/BaseNumberGroup.vue'
import BaseSaveButton from '@/components/common/BaseSaveButton.vue'
import BaseToggle from '@/components/common/BaseToggle.vue'

const settingsStore = useSettingsStore()
const isSaving = ref(false)
const expiryRule = ref({ enabled: false, days_before: 7 })

watchEffect(() => {
  const data = settingsStore.config
  if (data && data.expiry_rule) {
    try { 
      expiryRule.value = JSON.parse(data.expiry_rule) 
    } catch (e) {
      console.error("解析过期规则配置失败", e)
    }
  }
})

const saveData = async () => {
  isSaving.value = true
  try {
    await settingsStore.updateSettings({ 
      expiry_rule: JSON.stringify(expiryRule.value) 
    })
    showToast('保存成功', 'success')
  } catch (e) { 
    showToast('保存失败', 'error') 
    console.error(e)
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
/* 局部布局样式排版 */
.rule-form-row { 
  display: flex; 
  align-items: flex-start; 
  gap: 32px; 
  margin-bottom: 24px; 
  
}

.toggle-group { 
  margin-bottom: 0; 
}

.toggle-group label { 
  display: block; 
  font-size: 14px; 
  font-weight: 600; 
  margin-bottom: 12px; 
  color: var(--text-main); 
}

.toggle-wrapper { 
  display: flex; 
  gap: 10px; 
  align-items: center; 
  height: 36px; 
}

.toggle-label { 
  font-size: 14px; 
  color: var(--text-main); 
}

.action-row {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}
</style>