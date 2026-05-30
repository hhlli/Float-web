<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-card">
          <div class="card-header">编辑节点属性: {{ form.node_id }}</div>
          <div class="card-body">
            <div class="form-group">
              <label>显示名称</label>
              <input type="text" v-model="form.name">
            </div>

            <div class="form-row" style="display: flex; gap: 12px;">
              <div class="form-group" style="flex: 2;">
                <label>费用</label>
                <input type="number" step="0.01" v-model="form.cost" placeholder="留空或0表示免费">
              </div>
              <div class="form-group" style="flex: 1;">
                <label>货币</label>
                <select v-model="form.currency" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--surface-color); color: var(--text-main); font-size: 14px;">
                  <option value="CNY">CNY (¥)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div class="form-group" style="flex: 1;">
                <label>周期</label>
                <select v-model="form.billing_cycle" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--surface-color); color: var(--text-main); font-size: 14px;">
                  <option value="month">月付</option>
                  <option value="quarter">季付</option>
                  <option value="year">年付</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>到期日</label>
              <input type="date" v-model="form.billing_date">
            </div>

            <div class="form-row" style="display: flex; gap: 12px;">
              <div class="form-group" style="flex: 1;">
                <label>月流量 (GB)</label>
                <input type="number" v-model="form.monthly_bw" placeholder="留空表示无限制">
              </div>
              <div class="form-group" style="flex: 1;">
                <label>流量重置日</label>
                <input type="number" min="1" max="31" v-model="form.bw_reset_day" placeholder="1-31">
              </div>
            </div>

            <div class="form-group">
              <label>备注信息</label>
              <input type="text" v-model="form.notes" placeholder="例如: 核心业务节点 / 仅作测试">
            </div>

            <div class="action-row" style="justify-content: flex-end; margin-top: 24px; gap: 12px; display: flex;">
              <button class="btn-outline" @click="$emit('close')">取消</button>
              <button class="btn-primary" @click="submitEdit" :disabled="isSubmitting">
                {{ isSubmitting ? '保存中...' : '保存更改' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import request from '@/utils/request.js' 
import { showToast } from '@/utils/toast.js'

const props = defineProps({
  show: Boolean,
  serverData: Object
})

const emit = defineEmits(['close', 'refresh'])

const isSubmitting = ref(false)
const form = ref({
  node_id: '', name: '', cost: null, currency: 'CNY', billing_cycle: 'month', billing_date: '', monthly_bw: null, bw_reset_day: 1, notes: ''
})

watch(() => props.show, (newVal) => {
  if (newVal && props.serverData) {
    form.value = { ...props.serverData }
    // 兼容旧数据，如果旧数据没有周期字段，默认赋予 month
    if (!form.value.billing_cycle) {
      form.value.billing_cycle = 'month'
    }
  }
})

const submitEdit = async () => {
  isSubmitting.value = true
  try {
    const payload = {
      ...form.value,
      cost: form.value.cost !== null && form.value.cost !== '' ? parseFloat(form.value.cost) : 0,
      monthly_bw: form.value.monthly_bw !== null && form.value.monthly_bw !== '' ? parseFloat(form.value.monthly_bw) : 0,
      bw_reset_day: form.value.bw_reset_day ? parseInt(form.value.bw_reset_day, 10) : 1
    }

    await request.post('/api/admin/servers/save', payload)
    
    emit('refresh') 
    emit('close')
  } catch (e) {
    console.error("更新失败", e)
    showToast('保存失败，详情请查看控制台日志', 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>