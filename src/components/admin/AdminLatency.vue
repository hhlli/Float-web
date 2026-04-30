<template>
  <div class="view-section active">
    
    <div class="card fluid-card">
      <div class="card-header flex-header">
        <span>任务列表</span>
        <button class="btn-primary" @click="openAddModal">新建监测任务</button>
      </div>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>任务名称</th>
              <th>协议类型</th>
              <th>目标 (Target)</th>
              <th>监测节点</th>
              <th>监测频率 (秒)</th>
              <th style="text-align: right; padding-right: 20px;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="tasks.length === 0">
              <td colspan="6" style="text-align:center; color: var(--text-muted); padding: 40px 0;">
                暂无监测任务
              </td>
            </tr>
            
            <tr v-for="task in tasks" :key="task.id">
              <td style="font-weight: 500;">
                {{ task.name }}
              </td>
              <td>
                <span class="badge badge-info">{{ task.type }}</span>
              </td>
              <td style="color: var(--text-muted); font-family: monospace;">
                {{ task.target }}
              </td>
              <td style="font-size: 13px;">
                <span v-if="!task.excluded_nodes || task.excluded_nodes.length === 0" style="color: #10b981;">全部参与</span>
                <span v-else style="color: #f59e0b;">已排除 {{ task.excluded_nodes.length }} 个节点</span>
              </td>
              <td style="color: var(--text-muted); font-size: 13px;">
                {{ task.interval }} 秒/次
              </td>
              <td style="text-align: right;">
                <div class="action-icons">
                  <button class="icon-btn edit" title="编辑任务" @click="openEditModal(task)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button class="icon-btn danger" title="删除任务" @click="confirmDeleteTask(task)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BaseModal :show="showFormModal" :title="isEditing ? '编辑监测任务' : '新建监测任务'" @close="closeFormModal">
<div class="form-row" style="display: flex; gap: 12px;">
        <div class="form-group" style="flex: 2;">
          <label>任务名称</label>
          <input type="text" v-model="form.name" placeholder="例如：国内百度延迟" class="form-control">
        </div>
        <div class="form-group" style="flex: 1;">
          <label>协议类型</label>
          <select v-model="form.type" class="form-control">
            <option value="ICMP">ICMP (Ping)</option>
            <option value="TCP">TCP</option>
            <option value="HTTP">HTTP(S)</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>目标 (IP/域名)</label>
        <input type="text" v-model="form.target" placeholder="例如：baidu.com" class="form-control">
      </div>

<div class="form-row" style="display: flex; gap: 12px; margin-top: 16px;">
        <div class="form-group" style="flex: 2;">
          <label>排除的节点 (打勾表示不参与监测，默认全参与)</label>
          <div class="form-control" style="height: 120px; overflow-y: auto; padding: 10px;">
            <label v-for="node in serverStore.servers" :key="node.node_id" style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-weight: normal; cursor: pointer;">
              <input type="checkbox" :value="node.node_id" v-model="form.excluded_nodes">
              {{ node.name }}
            </label>
            <div v-if="serverStore.servers.length === 0" style="color: #94a3b8; font-size: 13px;">暂无在线节点</div>
          </div>
        </div>
        <div class="form-group" style="flex: 1;">
          <label>频率 (秒)</label>
          <input type="number" v-model.number="form.interval" min="1" class="form-control">
        </div>
      </div>

      <template #footer>
        <button class="btn-outline" @click="closeFormModal">取消</button>
        <button class="btn-primary" @click="submitTask" :disabled="loading">
          {{ loading ? '保存中...' : '保存任务' }}
        </button>
      </template>
    </BaseModal>

    <BaseModal :show="showDeleteModal" title="确认删除任务" @close="showDeleteModal = false">
      <div style="text-align: center; padding: 10px 0;">
        <div class="warning-icon-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="warning-svg"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <p style="margin-top: 16px; color: var(--text-main);">确定要删除任务 <strong>{{ taskToDelete?.name }}</strong> 吗？</p>
      </div>
      <template #footer>
        <button class="btn-outline" @click="showDeleteModal = false">取消</button>
        <button class="btn-danger-solid" @click="executeDelete">确认删除</button>
      </template>
    </BaseModal>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import request from '../../utils/request.js'
import BaseModal from '../../components/common/BaseModal.vue'
import { useServerStore } from '../../store/server.js'

const serverStore = useServerStore()
const tasks = ref([])

// 弹窗与加载状态控制
const showFormModal = ref(false)
const showDeleteModal = ref(false)
const loading = ref(false)

// 业务状态标记
const isEditing = ref(false)
const currentTaskId = ref(null)
const taskToDelete = ref(null)

const form = ref({
  name: '',
  type: 'ICMP',
  target: '',
  excluded_nodes: [], // 🌟 更改为数组
  interval: 60
})

// 初始化与自动选中节点
watch(() => [showFormModal.value, serverStore.servers], ([isOpen, servers]) => {
  if (isOpen && !isEditing.value && !form.value.node_id && servers && servers.length > 0) {
    form.value.node_id = servers[0].node_id
  }
}, { immediate: true })

const fetchTasks = async () => {
  try {
    const data = await request.get('/api/admin/tasks/all')
    tasks.value = data || []
  } catch (e) {
    console.error(e)
  }
}

const getNodeName = (id) => {
  const node = serverStore.servers.find(n => n.node_id === id)
  return node ? node.name : id
}

// 🌟 打开新建弹窗
const openAddModal = () => {
  isEditing.value = false
  currentTaskId.value = null
  form.value = {
    name: '',
    type: 'ICMP',
    target: '',
    excluded_nodes: [], // 默认全不排除
    interval: 60
  }
  showFormModal.value = true
}

// 🌟 打开编辑弹窗并回填数据
const openEditModal = (task) => {
  isEditing.value = true
  currentTaskId.value = task.id
  form.value = {
    name: task.name,
    type: task.type,
    target: task.target,
    excluded_nodes: task.excluded_nodes || [],
    interval: task.interval
  }
  showFormModal.value = true
}

const closeFormModal = () => {
  showFormModal.value = false
}

const submitTask = async () => {
  if (!form.value.name || !form.value.target) {
    alert("请填写完整信息")
    return
  }
  loading.value = true
  try {
    if (isEditing.value) {
      // 执行更新请求：发送到后端的 edit 或 update 接口
      await request.post('/api/admin/tasks/edit', { 
        id: currentTaskId.value, 
        ...form.value 
      })
    } else {
      // 执行新建请求
      await request.post('/api/admin/tasks/add', form.value)
    }
    showFormModal.value = false
    fetchTasks()
  } catch (e) {
    alert(isEditing.value ? "编辑任务失败" : "新建任务失败")
    console.error(e)
  } finally {
    loading.value = false
  }
}

const confirmDeleteTask = (task) => {
  taskToDelete.value = task
  showDeleteModal.value = true
}

const executeDelete = async () => {
  if (!taskToDelete.value) return
  try {
    await request.delete(`/api/admin/tasks/delete?id=${taskToDelete.value.id}`)
    showDeleteModal.value = false
    taskToDelete.value = null
    fetchTasks()
  } catch (e) {
    alert("删除失败")
  }
}

onMounted(() => {
  if (serverStore.servers.length === 0) {
    serverStore.fetchServers() 
  }
  fetchTasks()
})
</script>

<style scoped>
.fluid-card { width: 100%; margin-bottom: 20px; }
.table-responsive { width: 100%; overflow-x: auto; }

/* 头部 Flex 布局对齐 */
.flex-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

th {
  font-weight: 500;
  color: var(--text-muted);
  font-size: 13px;
}

.badge-info { 
  background: rgba(56, 189, 248, 0.15); 
  color: #38bdf8; 
  padding: 2px 6px; 
  border-radius: 4px; 
  font-size: 11px; 
}

/* 图标按钮样式 */
.action-icons {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}
.icon-btn {
  background: transparent;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 6px;
  padding: 6px;
  cursor: pointer;
  color: var(--text-muted, #64748b);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.icon-btn svg {
  width: 16px;
  height: 16px;
}

/* 🌟 新增：编辑按钮的 Hover 效果 */
.icon-btn.edit:hover {
  background: #eff6ff;
  color: #3b82f6;
  border-color: #3b82f6;
}

.icon-btn.danger {
  color: #ef4444;
}
.icon-btn.danger:hover {
  background: #fef2f2;
  border-color: #ef4444;
}

/* 警告图标样式 */
.warning-icon-wrapper {
  width: 50px; height: 50px; border-radius: 50%; background: #fee2e2; 
  display: flex; align-items: center; justify-content: center; margin: 0 auto;
}
.warning-svg { width: 24px; height: 24px; color: #ef4444; }

/* 表单样式 */
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
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  box-sizing: border-box;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  background: #fff;
}
.form-control:focus {
  border-color: var(--primary-color, #3b82f6);
}
.form-control:disabled {
  background-color: #f1f5f9;
  cursor: not-allowed;
  color: #94a3b8;
}
</style>