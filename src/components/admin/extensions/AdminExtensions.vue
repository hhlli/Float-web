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
                <td colspan="5" class="empty-cell">暂无可用插件</td>
              </tr>
              
              <tr v-for="ext in extensions" :key="ext.id">
                <td class="task-name">{{ ext.name }}</td>
                <td>
                  <span v-if="ext.installed_nodes && ext.installed_nodes.length > 0" class="badge active">
                    已安装 ({{ ext.installed_nodes.length }} 节点)
                  </span>
                  <span v-else class="badge inactive">未安装</span>
                </td>
                <td class="plugin-desc" :title="ext.description">{{ ext.description }}</td>
                <td class="task-interval">{{ ext.version || '-' }}</td>
                <td class="col-actions">
                  <div class="action-buttons">
                    <button 
                      v-if="ext.installed_nodes && ext.installed_nodes.length > 0"
                      class="action-btn-icon play" 
                      title="运行插件" 
                      @click="openPluginWorkspace(ext)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    </button>

                    <button class="btn-outline btn-sm btn-action" @click="openNodeSelectModal(ext, 'install')">
                      部署
                    </button>
                    <button 
                      v-if="ext.installed_nodes && ext.installed_nodes.length > 0"
                      class="btn-outline btn-sm btn-danger" 
                      @click="openNodeSelectModal(ext, 'uninstall')"
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

    <BaseModal :show="showNodeModal" :title="nodeModalTitle" @close="showNodeModal = false">
      <div class="node-list-container">
        <div v-if="filteredServers.length === 0" class="empty-text">
          没有可操作的服务器节点
        </div>
        <div v-for="server in filteredServers" :key="server.node_id" class="node-checkbox-item">
          <label class="checkbox-label">
            <input type="checkbox" :value="server.node_id" v-model="selectedNodes" />
            <span class="node-name">{{ server.name }}</span>
            <span class="node-status" :class="{'online': isOnline(server)}">
              {{ isOnline(server) ? '在线' : '离线' }}
            </span>
          </label>
        </div>
      </div>
      <template #footer>
        <button class="btn-outline" @click="showNodeModal = false">取消</button>
        <button 
          :class="actionType === 'install' ? 'btn-primary' : 'btn-danger-solid'" 
          @click="executeAction"
          :disabled="selectedNodes.length === 0"
        >
          {{ actionType === 'install' ? '确认部署' : '确认卸载' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '@/utils/request.js'
import { showToast } from '@/utils/toast.js'
import BaseModal from '@/components/common/BaseModal.vue'
import { useServerStore } from '@/store/server.js'
import { useRouter } from 'vue-router'

const serverStore = useServerStore()

const extensions = ref([])
const router = useRouter()
const showNodeModal = ref(false)
const actionType = ref('install')
const targetExtension = ref(null)
const selectedNodes = ref([])

const nodeModalTitle = computed(() => {
  return actionType.value === 'install' ? '选择部署节点' : '选择卸载节点'
})

// 根据操作类型过滤显示的服务器
const filteredServers = computed(() => {
  if (!targetExtension.value) return []
  const installedSet = new Set(targetExtension.value.installed_nodes || [])
  
  if (actionType.value === 'install') {
    // 部署：仅显示未安装的节点
    return serverStore.servers.filter(s => !installedSet.has(s.node_id))
  } else {
    // 卸载：仅显示已安装的节点
    return serverStore.servers.filter(s => installedSet.has(s.node_id))
  }
})

const isOnline = (server) => {
  return (Date.now() / 1000 - server.last_active < 180)
}

const loadExtensions = async () => {
  try {
    const data = await request.get('/api/admin/extensions/list')
    extensions.value = Array.isArray(data) ? data : (data?.data || [])
  } catch (e) {
    showToast('获取插件状态失败', 'error')
  }
}

const openPluginWorkspace = (ext) => {
  router.push({
    path: '/admin/plugin-workspace',
    query: { 
      ext_id: ext.id,
      nodes: ext.installed_nodes.join(',') 
    }
  })
}

const openNodeSelectModal = (ext, action) => {
  targetExtension.value = ext
  actionType.value = action
  selectedNodes.value = []
  
  if (serverStore.servers.length === 0) {
    serverStore.fetchStaticServers()
  }
  
  showNodeModal.value = true
}

const executeAction = async () => {
  if (selectedNodes.value.length === 0) return
  
  const endpoint = actionType.value === 'install' ? '/api/admin/extensions/install' : '/api/admin/extensions/uninstall'
  
  try {
    await request.post(endpoint, { 
      id: targetExtension.value.id,
      target_nodes: selectedNodes.value
    })
    showToast('指令已下发', 'success')
    showNodeModal.value = false
    loadExtensions()
  } catch (e) {
    showToast('操作失败', 'error')
  }
}

onMounted(() => {
  loadExtensions()
})
</script>

<style scoped>
/* 继承原有基础样式，新增节点选择列表样式 */
.view-section { width: 100%; }
.flex-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-title { margin-bottom: 0; }
.table-responsive { width: 100%; overflow-x: auto; }
.table-responsive table { min-width: max-content; }
.task-name, .task-interval, .col-actions { white-space: nowrap; }
.empty-cell { text-align: center; color: var(--text-muted); padding: 40px 0; }
.task-name { font-weight: 500; }
.plugin-desc { color: var(--text-muted); font-size: 13px; max-width: 400px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.col-actions { text-align: right; padding-right: 20px; }

.badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; display: inline-block;}
.badge.active { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.badge.inactive { background: rgba(100, 116, 139, 0.15); color: #64748b; }

/* 操作列按钮容器：增加 align-items: center 确保纵向居中对齐，并收紧 gap */
.action-buttons { 
  display: flex; 
  justify-content: flex-end; 
  align-items: center; 
  gap: 6px; 
}

/* 文本按钮：设置固定高度并使用 flex 居中文字 */
.btn-sm { 
  height: 28px; 
  padding: 0 12px; 
  font-size: 12px; 
  cursor: pointer; 
  border-radius: 4px; 
  transition: background 0.2s; 
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.btn-outline { background: transparent; }
.btn-action { color: #3b82f6; border: 1px solid #3b82f6; }
.btn-action:hover { background: rgba(59, 130, 246, 0.1); }
.btn-danger { color: #ef4444; border: 1px solid #ef4444; }
.btn-danger:hover { background: rgba(239, 68, 68, 0.1); }

/* 图标按钮：设置宽高一致 (28x28)，对齐全局操作图标标准 */
.action-btn-icon { 
  display: inline-flex; 
  align-items: center; 
  justify-content: center; 
  width: 28px; 
  height: 28px; 
  background: transparent; 
  border-radius: 4px; 
  cursor: pointer; 
  padding: 0;
  box-sizing: border-box;
}

.action-btn-icon svg { width: 15px; height: 15px; }
.action-btn-icon.play { color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4); }

.node-list-container { 
  max-height: 300px; 
  overflow-y: auto; 
  padding: 10px 0; 
  display: flex; 
  flex-wrap: wrap;
  gap: 16px 24px;
}
.empty-text { text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px 0; width: 100%; }
.node-checkbox-item { margin: 0; }
.checkbox-label { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  cursor: pointer; 
  font-size: 14px; 
  color: var(--text-main); 
}
.checkbox-label input[type="checkbox"] { 
  width: 16px !important; 
  height: 16px !important; 
  margin: 0; 
  padding: 0;
  flex-shrink: 0; 
  cursor: pointer;
  accent-color: var(--primary-color, #3b82f6);
}
.node-name { 
  font-weight: 500;
  white-space: nowrap;
}
.node-status { font-size: 12px; padding: 2px 6px; border-radius: 4px; background: rgba(100, 116, 139, 0.1); color: #64748b; flex-shrink: 0; }
.node-status.online { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.btn-danger-solid { background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: background 0.2s; }
.btn-danger-solid:hover { background: #dc2626; }
.btn-danger-solid:disabled { background: #fca5a5; cursor: not-allowed; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>