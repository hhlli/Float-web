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
// 🌟 1. 引入我们封装好的 request
import request from '../../../utils/request.js' 

const props = defineProps({
  show: Boolean,
  serverData: Object
  // 🌟 移除了 token prop
})

const emit = defineEmits(['close', 'refresh'])

const isSubmitting = ref(false)
const form = ref({
  node_id: '', name: '', cost: null, currency: 'CNY', billing_date: '', monthly_bw: null, bw_reset_day: 1, notes: ''
})

// 当传入的数据变化或弹窗显示时，同步数据到表单
watch(() => props.show, (newVal) => {
  if (newVal && props.serverData) {
    form.value = { ...props.serverData }
  }
})

const submitEdit = async () => {
  isSubmitting.value = true
  try {
    // 🌟 2. 格式化数字字段，兜底防止 Go 后端解析 JSON 时报 400 错误
    const payload = {
      ...form.value,
      cost: form.value.cost ? parseFloat(form.value.cost) : 0,
      monthly_bw: form.value.monthly_bw ? parseFloat(form.value.monthly_bw) : 0,
      bw_reset_day: form.value.bw_reset_day ? parseInt(form.value.bw_reset_day, 10) : 1
    }

    // 🌟 3. 使用 request.post 代替原生的 fetch，无需传 token 和 headers
    await request.post('/api/admin/servers/update', payload)
    
    emit('refresh') // 告诉父组件刷新列表
    emit('close')
  } catch (e) {
    console.error("更新失败", e)
    // 错误在拦截器已经统一处理了一部分，这里只需提示业务错误
    alert("保存失败，详情请查看控制台日志")
  } finally {
    isSubmitting.value = false
  }
}
</script>