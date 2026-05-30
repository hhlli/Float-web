<template>
  <div class="view-section active">
    
    <div class="card">
      <div class="card-body">
        <div class="flex-header">
          <h3 class="section-title">任务列表</h3>
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
              <th class="col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="tasks.length === 0">
              <td colspan="6" class="empty-cell">
                暂无监测任务
              </td>
            </tr>
            
            <tr v-for="task in tasks" :key="task.id">
              <td class="task-name">
                {{ task.name }}
              </td>
              <td>
                <span class="badge info">{{ task.type }}</span>
              </td>
              <td class="task-target">
                {{ task.target }}
              </td>
              <td class="task-nodes">
                <span v-if="!task.excluded_nodes || task.excluded_nodes.length === 0" class="status-success">全部参与</span>
                <span v-else class="status-warning">已排除 {{ task.excluded_nodes.length }} 个节点</span>
              </td>
              <td class="task-interval">
                {{ task.interval }} 秒/次
              </td>
              <td class="col-actions">
                <div class="action-icons">
                  <button class="action-btn edit" title="编辑任务" @click="openEditModal(task)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button class="action-btn danger" title="删除任务" @click="confirmDeleteTask(task)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    </div>

    <BaseModal :show="showFormModal" :title="isEditing ? '编辑监测任务' : '新建监测任务'" @close="closeFormModal">
      <div class="form-row custom-gap">
        <div class="form-group flex-2">
          <label>任务名称</label>
          <input type="text" class="form-control" v-model="form.name" placeholder="例如：国内百度延迟">
        </div>
        <div class="form-group flex-1">
          <label>协议类型</label>
          <select class="form-control" v-model="form.type">
            <option value="ICMP">ICMP</option>
            <option value="TCP">TCP</option>
            <option value="HTTP">HTTP</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>目标 (IP/域名)</label>
        <input type="text" class="form-control" v-model="form.target" placeholder="例如：baidu.com">
      </div>

      <div class="form-row custom-gap mt-16">
        <div class="form-group flex-2">
          <label>排除的节点 (默认全参与)</label>
          <div class="checkbox-list-box">
            <label v-for="node in serverStore.servers" :key="node.node_id" class="checkbox-item">
              <input type="checkbox" :value="node.node_id" v-model="form.excluded_nodes">
              {{ node.name }}
            </label>
            <div v-if="serverStore.servers.length === 0" class="empty-nodes">暂无在线节点</div>
          </div>
        </div>
        <div class="form-group flex-1">
          <label>频率 (秒)</label>
          <input type="number" class="form-control" v-model.number="form.interval" min="1">
        </div>
      </div>

      <template #footer>
        <button class="btn-outline" @click="closeFormModal">取消</button>
        <BaseSaveButton :loading="loading" :text="isEditing ? '保存修改' : '保存任务'" @click="submitTask" />
      </template>
    </BaseModal>

    <BaseModal :show="showDeleteModal" title="确认删除任务" @close="showDeleteModal = false">
      <div class="delete-confirm-box">
        <div class="warning-icon-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="warning-svg"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <p class="delete-text">确定要删除任务 <strong>{{ taskToDelete?.name }}</strong> 吗？</p>
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
import request from '@/utils/request.js'
import { showToast } from '@/utils/toast.js'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseSaveButton from '@/components/common/BaseSaveButton.vue'
import { useServerStore } from '@/store/server.js'

const serverStore = useServerStore()
const tasks = ref([])

const showFormModal = ref(false)
const showDeleteModal = ref(false)
const loading = ref(false)

const isEditing = ref(false)
const currentTaskId = ref(null)
const taskToDelete = ref(null)

const form = ref({
  name: '',
  type: 'ICMP',
  target: '',
  excluded_nodes: [], 
  interval: 60
})

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

const openAddModal = () => {
  isEditing.value = false
  currentTaskId.value = null
  form.value = {
    name: '',
    type: 'ICMP',
    target: '',
    excluded_nodes: [], 
    interval: 60
  }
  showFormModal.value = true
}

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
    showToast("请填写完整信息", "error")
    return
  }
  loading.value = true
  try {
    if (isEditing.value) {
      await request.post('/api/admin/tasks/edit', { 
        id: currentTaskId.value, 
        ...form.value 
      })
      showToast("编辑成功", "success")
    } else {
      await request.post('/api/admin/tasks/add', form.value)
      showToast("新建成功", "success")
    }
    showFormModal.value = false
    fetchTasks()
  } catch (e) {
    showToast(isEditing.value ? "编辑任务失败" : "新建任务失败", "error")
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
    showToast("删除成功", "success")
    showDeleteModal.value = false
    taskToDelete.value = null
    fetchTasks()
  } catch (e) {
    showToast("删除失败", "error")
  }
}

onMounted(() => {
  if (serverStore.servers.length === 0) {
    serverStore.fetchStaticServers() //  修改为正确的 Action 名称
  }
  fetchTasks()
})
</script>

<style scoped>
.table-responsive { width: 100%; overflow-x: auto; }
.table-responsive table {
  min-width: max-content;
}

/* 确保主要数据列文字不换行 */
.task-name, .task-target, .task-nodes, .task-interval, .col-actions {
  white-space: nowrap;
}
.empty-cell { text-align: center; color: var(--text-muted); padding: 40px 0; }

/* 表格列排版与颜色 */
.task-name { font-weight: 500; }
.task-target { color: var(--text-muted); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
.task-nodes { font-size: 13px; }
.task-interval { color: var(--text-muted); font-size: 13px; }
.col-actions { text-align: right; padding-right: 20px; }

/* 状态色控制 */
.status-success { color: #10b981; }
.status-warning { color: #f59e0b; }

/* 表单内部布局补丁 */
.custom-gap { gap: 12px; flex-wrap: wrap; }
.flex-1, .flex-2 {
  /* 新增：设定输入框的最小压缩极限，低于此值触发折行 */
  min-width: 200px; 
}
.mt-16 { margin-top: 16px; }

/* 节点多选框列表区 */
.checkbox-list-box {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  height: 120px;
  overflow-y: auto;
  padding: 10px;
  background: var(--surface-color);
}
.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: normal;
  cursor: pointer;
  color: var(--text-main);
  white-space: nowrap;
}
.empty-nodes { color: var(--text-muted); font-size: 13px; }

/* 删除弹窗居中 */
.delete-confirm-box { text-align: center; padding: 10px 0; }
.delete-text { margin-top: 16px; color: var(--text-main); }
/* 覆盖可能存在的全局 input 样式 */
.checkbox-item input[type="checkbox"] {
  width: auto;
  flex: none;
  margin: 0;
}

/* 确保父容器从左到右正常对齐 */
.checkbox-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: normal;
  cursor: pointer;
  color: var(--text-main);
}
</style>