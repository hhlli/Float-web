<template>
  <div class="view-section active">
    
    <div class="card">
      <div class="card-body">
        <div class="flex-header">
          <h3 class="section-title">拓展插件管理</h3>
          <button class="btn-primary" @click="loadExtensions">刷新状态</button>
        </div>
        
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>插件名称</th>
                <th>状态</th>
                <th>描述</th>
                <th>版本</th>
                <th class="col-actions">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="extensions.length === 0">
                <td colspan="5" class="empty-cell">
                  暂无可用插件
                </td>
              </tr>
              
              <tr v-for="ext in extensions" :key="ext.id">
                <td class="task-name">
                  {{ ext.name }}
                </td>
                <td>
                  <span v-if="ext.installed" class="badge active">已安装</span>
                  <span v-else class="badge inactive">未安装</span>
                </td>
                <td class="plugin-desc" :title="ext.description">
                  {{ ext.description }}
                </td>
                <td class="task-interval">
                  {{ ext.version || '-' }}
                </td>
                <td class="col-actions">
                  <div class="action-buttons">
                    <button 
                      v-if="ext.installed && ext.id === 'mtr-plugin'"
                      class="action-btn-icon play" 
                      title="运行诊断" 
                      @click="showMtrModal = true"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    </button>

                    <button 
                      v-if="!ext.installed"
                      class="btn-outline btn-sm btn-action" 
                      @click="installExtension(ext.id)"
                    >
                      安装
                    </button>
                    <button 
                      v-if="ext.installed"
                      class="btn-outline btn-sm btn-danger" 
                      @click="confirmUninstall(ext.id)"
                    >
                      卸载
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <MTRModal :show="showMtrModal" @close="showMtrModal = false" />

    <BaseModal :show="showDeleteModal" title="确认卸载插件" @close="showDeleteModal = false">
      <div class="delete-confirm-box">
        <div class="warning-icon-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="warning-svg"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <p class="delete-text">确定要卸载插件 <strong>{{ extToDelete }}</strong> 吗？</p>
      </div>
      <template #footer>
        <button class="btn-outline" @click="showDeleteModal = false">取消</button>
        <button class="btn-danger-solid" @click="executeUninstall">确认卸载</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request.js'
import { showToast } from '@/utils/toast.js'
import BaseModal from '@/components/common/BaseModal.vue' // 引入基础弹窗组件
import MTRModal from './MTRModal.vue'

const showMtrModal = ref(false)
const showDeleteModal = ref(false)
const extToDelete = ref(null)

const extensions = ref([
  {
    id: 'mtr-plugin',
    name: 'MTR 路由追踪',
    description: '提供从探针节点到目标 IP 的全链路 MTR 路由追踪诊断能力。',
    version: 'v1.0.0',
    installed: false
  }
])

const loadExtensions = async () => {
  try {
    const data = await request.get('/api/admin/extensions/list')
    let remoteList = []
    if (Array.isArray(data)) {
      remoteList = data
    } else if (data && Array.isArray(data.data)) {
      remoteList = data.data
    } else if (typeof data === 'string') {
      try { remoteList = JSON.parse(data) } catch (e) { remoteList = [] }
    }

    if (remoteList && remoteList.length > 0) {
      extensions.value.forEach(localExt => {
        const remoteExt = remoteList.find(r => r.id === localExt.id)
        if (remoteExt) {
          localExt.installed = remoteExt.installed
        }
      })
    }
  } catch (e) {
    console.error('获取插件列表失败:', e)
  }
}

const installExtension = async (id) => {
  try {
    await request.post('/api/admin/extensions/install', { id })
    showToast('插件安装指令已下发', 'success')
    loadExtensions()
  } catch (e) {
    showToast('安装失败', 'error')
  }
}

const confirmUninstall = (id) => {
  extToDelete.value = id
  showDeleteModal.value = true
}

const executeUninstall = async () => {
  if (!extToDelete.value) return
  
  try {
    await request.post('/api/admin/extensions/uninstall', { id: extToDelete.value })
    showToast('已卸载', 'success')
    loadExtensions()
  } catch (e) {
    showToast('操作失败', 'error')
  } finally {
    showDeleteModal.value = false
    extToDelete.value = null
  }
}

onMounted(() => {
  loadExtensions()
})
</script>

<style scoped>
.view-section { width: 100%; }

.flex-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.section-title { margin-bottom: 0; }

.table-responsive { width: 100%; overflow-x: auto; }
.table-responsive table {
  min-width: max-content;
}

.task-name, .task-interval, .col-actions {
  white-space: nowrap;
}
.empty-cell { text-align: center; color: var(--text-muted); padding: 40px 0; }

.task-name { font-weight: 500; }
.plugin-desc { color: var(--text-muted); font-size: 13px; max-width: 400px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.task-interval { color: var(--text-muted); font-size: 13px; }
.col-actions { text-align: right; padding-right: 20px; }

.badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; display: inline-block;}
.badge.active { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.badge.inactive { background: rgba(100, 116, 139, 0.15); color: #64748b; }

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-sm { 
  padding: 4px 12px; 
  font-size: 12px; 
  cursor: pointer; 
  border-radius: 4px;
  transition: background 0.2s;
}
.btn-outline { background: transparent; }

.btn-action { color: #3b82f6; border: 1px solid #3b82f6; }
.btn-action:hover { background: rgba(59, 130, 246, 0.1); }

.btn-danger { color: #ef4444; border: 1px solid #ef4444; }
.btn-danger:hover { background: rgba(239, 68, 68, 0.1); }

.action-btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  padding: 4px;
}
.action-btn-icon svg { width: 14px; height: 14px; }
.action-btn-icon.play { color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4); }
.action-btn-icon.play:hover { background: rgba(16, 185, 129, 0.1); }

/* 卸载确认弹窗样式 */
.delete-confirm-box { text-align: center; padding: 10px 0; }
.warning-icon-wrapper { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 50%; background: #fef2f2; color: #ef4444; margin-bottom: 8px; }
.warning-svg { width: 24px; height: 24px; }
.delete-text { margin-top: 16px; color: var(--text-main); font-size: 15px; }
.btn-danger-solid { background: #ef4444; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; transition: background 0.2s; }
.btn-danger-solid:hover { background: #dc2626; }
</style>