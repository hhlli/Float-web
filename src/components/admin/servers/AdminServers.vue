<template>
  <div class="view-section active">
    
    <div class="card fluid-card">
      <div class="card-body">
        
        <div class="flex-header">
          <h3 class="section-title">节点列表</h3>
          <button class="btn-primary" @click="openAddNodeModal">添加节点</button>
        </div>
        
        <div class="table-responsive">
          <table style="width: 100%; table-layout: auto; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="width: 20%; min-width: 160px;">名称</th>
                <th style="width: 15%; min-width: 130px;">IP 地址</th>
                <th style="width: 12%; min-width: 110px;">版本号</th>
                <th style="width: 5%; min-width: 70px;">地区</th>
                <th style="width: auto; min-width: 120px;">备注信息</th>
                <th style="width: 12%; min-width: 100px;">到期日</th>
                <th style="width: 15%; min-width: 180px; text-align: right; padding-right: 20px;">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="serverStore.servers.length === 0">
                <td colspan="7" style="text-align:center; padding: 40px 0; color: var(--text-muted);">
                  {{ serverStore.loading ? '加载中...' : '暂无节点' }}
                </td>
              </tr>
              <tr v-for="s in serverStore.servers" :key="s.node_id">
                <td style="font-weight: 500; vertical-align: middle;">
                  <div style="display: flex; justify-content: space-between; align-items: center; width: 80%; padding-right: 10px;">
                    <span @click="openDetailModal(s)" style="cursor: pointer; color: var(--primary-color); word-break: break-all;">
                      {{ s.name }}
                    </span>
                    <div style="position: relative; display: flex; align-items: center;">
                      <StatusBadge :online="isOnline(s.last_active)" style="flex-shrink: 0;" />
                      <svg v-if="s.is_hidden" title="已隐藏" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; left: 100%; margin-left: 10px; width: 16px; height: 16px; color: var(--text-muted);">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    </div>
                  </div>
                </td>
                
                <td style="color: var(--text-muted); font-family: monospace; font-size: 12px; line-height: 1.5; white-space: nowrap;">
                  <div style="color: var(--text-main);">{{ s.ipv4 || '-' }}</div>
                  <div v-if="s.ipv6" style="opacity: 0.7; font-size: 11px;">{{ s.ipv6 }}</div>
                </td>

                <td style="color: var(--text-muted); font-size: 13px; white-space: nowrap;">
                  <div class="version-wrapper">
                    <span>{{ s.agent_version || '未知' }}</span>
                    <span 
                      v-if="hasUpdate(s.agent_version)" 
                      class="update-indicator" 
                      title="有新版本可用，点击获取部署命令"
                      @click="openDeployModal(s)"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      <span>{{ siteStore.latestVersion }}</span>
                    </span>
                  </div>
                </td>
                
                <td style="font-size: 16px; white-space: nowrap;" :title="s.region">{{ getFlagEmoji(s.region) }}</td>
                
                <td style="color: var(--text-muted); font-size: 13px; line-height: 1.5;">{{ s.notes || '-' }}</td>
                
                <td style="white-space: nowrap; color: var(--text-muted); font-size: 13px;">{{ s.billing_date || '-' }}</td>
                
                <td style="text-align: right; padding-right: 20px; white-space: nowrap;">
                  <div class="action-icons">
                    <button class="action-btn" title="一键部署" @click="openDeployModal(s)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </button>

                    <button class="action-btn" title="编辑节点" @click="openEditModal(s)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>

                    <button 
                      class="action-btn" 
                      :title="s.terminal_enabled === 1 ? '远程终端' : '未启用远程控制'" 
                      :style="{ opacity: s.terminal_enabled === 1 ? 1 : 0.4 }"
                      @click="openTerminal(s)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
                    </button>

                    <button class="action-btn" :title="s.is_hidden ? '取消隐藏' : '设为隐藏'" @click="toggleVisibility(s)">
                      <svg v-if="!s.is_hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    </button>

                    <button class="action-btn danger" title="删除节点" @click="confirmDeleteServer(s.node_id)">
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

    <BaseModal :show="showAddModal" title="添加新节点" @close="showAddModal = false">
      <div class="form-group">
        <label>节点名称</label>
        <input v-model="newNode.name" type="text" placeholder="例如：香港-CN2" class="form-control" />
      </div>
      <div class="form-row" style="display: flex; gap: 12px;">
        <div class="form-group" style="flex: 1;">
          <label>分组</label>
          <input v-model="newNode.group" type="text" placeholder="例如：亚洲区" class="form-control" />
        </div>
        <div class="form-group" style="flex: 1;">
          <label>标签</label>
          <input v-model="newNode.tags" type="text" placeholder="例如：建站, 解锁" class="form-control" />
        </div>
      </div>
      
      <template #footer>
        <button class="btn-outline" @click="showAddModal = false">取消</button>
        <button class="btn-primary" @click="submitAddNode">保存</button>
      </template>
    </BaseModal>

    <BaseModal :show="showDeleteModal" title="确认删除节点" @close="showDeleteModal = false">
      <div style="text-align: center; padding: 10px 0;">
        <div class="warning-icon-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="warning-svg"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <p style="margin-top: 16px; color: var(--text-main);">确定要删除节点 <strong>{{ nodeToDelete }}</strong> 吗？</p>
        <p style="color: var(--text-muted); font-size: 13px;">此操作不可撤销，关联的监测数据将同步清除。</p>
      </div>
      <template #footer>
        <button class="btn-outline" @click="showDeleteModal = false">取消</button>
        <button class="btn-danger-solid" @click="executeDelete">确认删除</button>
      </template>
    </BaseModal>

    <BaseModal :show="showDetailModal" :title="`节点详情: ${detailData.name}`" @close="showDetailModal = false">
      <div class="detail-container">
        <div class="info-row">
          <span class="label">UUID</span>
          <span class="value"><code class="uuid-code">{{ detailData.node_id }}</code></span>
        </div>
        <div class="info-row">
          <span class="label">探针版本</span>
          <span class="value">{{ detailData.agent_version || '未知' }}</span>
        </div>
        <div class="info-row">
          <span class="label">地区/分组</span>
          <span class="value">{{ detailData.region || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="label">标签/备注</span>
          <span class="value">{{ detailData.notes || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="label">系统</span>
          <span class="value">{{ detailData.os || '尚未上报' }}</span>
        </div>
        <div class="info-row">
          <span class="label">最后在线</span>
          <span class="value">{{ detailData.last_active ? new Date(detailData.last_active * 1000).toLocaleString() : '离线' }}</span>
        </div>
      </div>
      
      <template #footer>
        <button class="btn-primary" @click="showDetailModal = false">关闭</button>
      </template>
    </BaseModal>

    <DeployModal :show="showDeployModal" :serverData="selectedServer" @close="showDeployModal = false" />
    
    <EditServerModal 
      :show="showEditModal" 
      :serverData="selectedServer" 
      @close="showEditModal = false" 
      @refresh="handleEditSuccess" 
    />

    <TerminalModal 
      v-model:visible="terminalVisible"
      :node-id="currentTerminalNodeId"
      :node-name="currentTerminalNodeName"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue' 
import request from '@/utils/request.js' 
import { useServerStore } from '@/store/server.js'
import { useSiteStore } from '@/store/site.js' // 引入全局 siteStore
import { showToast } from '@/utils/toast.js' 

import BaseModal from '@/components/common/BaseModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import DeployModal from './DeployModal.vue'
import EditServerModal from './EditServerModal.vue'
import TerminalModal from './TerminalModal.vue' 

const serverStore = useServerStore()
const siteStore = useSiteStore() // 初始化 siteStore 实例

// 版本比对逻辑
const hasUpdate = (currentVersion) => {
  const latest = siteStore.latestVersion
  if (!currentVersion || !latest) return false

  const v1 = currentVersion.replace(/^v/, '').split('.')
  const v2 = latest.replace(/^v/, '').split('.')

  const len = Math.max(v1.length, v2.length)
  for (let i = 0; i < len; i++) {
    const num1 = parseInt(v1[i] || '0', 10)
    const num2 = parseInt(v2[i] || '0', 10)
    
    if (num1 < num2) return true
    if (num1 > num2) return false
  }
  return false
}

const terminalVisible = ref(false)
const currentTerminalNodeId = ref('')
const currentTerminalNodeName = ref('') 

const openTerminal = (server) => {
  if (server.terminal_enabled !== 1) {
    showToast('该节点未启用远程控制，请通过“一键部署”重新下发命令并勾选开启', 'warning') 
    return
  }
  currentTerminalNodeId.value = server.node_id
  currentTerminalNodeName.value = server.name 
  terminalVisible.value = true
}

const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeployModal = ref(false)
const showDeleteModal = ref(false)
const selectedServer = ref(null)
const nodeToDelete = ref(null)

const newNode = ref({ name: '', group: '', tags: '' })

const showDetailModal = ref(false)
const detailData = ref({})

const openDetailModal = (s) => {
  detailData.value = s
  showDetailModal.value = true
}

const getFlagEmoji = (code) => {
  if (!code || code === 'UN') return '🌐'
  return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)))
}
const isOnline = (ts) => (Date.now() / 1000) - ts < 180

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const generateShortName = () => {
  return 'Node-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

const openAddNodeModal = () => { 
  newNode.value = { name: '', group: '', tags: '' }; 
  showAddModal.value = true 
}

const openEditModal = (s) => { 
  selectedServer.value = { ...s }; 
  showEditModal.value = true 
}

const handleEditSuccess = async () => {
  await serverStore.fetchStaticServers(true);
  showToast('保存成功');
}

const confirmDeleteServer = (id) => { 
  nodeToDelete.value = id; 
  showDeleteModal.value = true 
}

const submitAddNode = async () => {
  const finalName = (newNode.value.name || '').trim() || generateShortName();
  
  try {
    const payload = {
      node_id: generateUUID(), 
      name: finalName, 
      region: newNode.value.group,   
      cost: 0,
      currency: "CNY",
      billing_date: "",
      monthly_bw: 0,
      bw_reset_day: 1,
      notes: newNode.value.tags      
    };

    await request.post('/api/admin/servers/save', payload);
    
    showToast('添加成功');
    showAddModal.value = false;
    await serverStore.fetchStaticServers(true); 
  } catch (err) {
    showToast('添加失败', 'error');
    console.error("保存请求失败:", err);
  }
}

const executeDelete = async () => { 
  try {
    await request.delete('/api/admin/servers/delete', { params: { node_id: nodeToDelete.value } });
    showToast('删除成功');
    showDeleteModal.value = false; 
    await serverStore.fetchStaticServers(true); 
  } catch (err) {
    showToast('删除失败', 'error');
    console.error("删除失败:", err);
  }
}

const toggleVisibility = async (s) => {
  const targetState = !s.is_hidden;
  const originalState = s.is_hidden;
  s.is_hidden = targetState; 
  
  try {
    await request.post('/api/admin/servers/save', { 
      ...s, 
      is_hidden: targetState 
    });
    
    showToast('状态更新成功');
    await serverStore.fetchStaticServers(true); 
  } catch (err) {
    s.is_hidden = originalState;
    showToast('状态更新失败', 'error');
    console.error("更新隐藏状态失败:", err);
  }
}

const openDeployModal = (s) => { 
  selectedServer.value = { ...s }; 
  showDeployModal.value = true 
}
</script>

<style scoped>
.table-responsive {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch; 
}

table {
  table-layout: fixed;
  width: 100%;
}

.name-cell-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
}

.action-icons {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.uuid-code {
  font-family: monospace;
  background: var(--bg-color);
  padding: 2px 6px;
  border-radius: 4px;
}

.version-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.update-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #ea580c; 
  background: #fff7ed;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.update-indicator:hover {
  opacity: 0.8;
}
</style>