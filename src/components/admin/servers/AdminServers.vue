<template>
  <div class="view-section active">
    
    <div class="card fluid-card">
      <div class="card-header flex-header">
        <span>节点列表</span>
        <button class="btn-primary" @click="openAddNodeModal">添加节点</button>
      </div>
      <div class="table-responsive">
        <table style="width: 100%; table-layout: auto; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="width: 25%; min-width: 200px;">名称</th>
              <th style="width: 18%; min-width: 140px;">IP 地址</th>
              <th style="width: 10%; min-width: 80px;">地区</th>
              <th style="width: auto; min-width: 120px;">配置信息 (备注)</th>
              <th style="width: 12%; min-width: 100px;">到期日</th>
              <th style="width: 15%; min-width: 180px; text-align: right; padding-right: 20px;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="serverStore.servers.length === 0">
              <td colspan="6" style="text-align:center; padding: 40px 0; color: var(--text-muted);">
                {{ serverStore.loading ? '加载中...' : '暂无节点' }}
              </td>
            </tr>
            <tr v-for="s in serverStore.servers" :key="s.node_id">
              <td style="font-weight: 500; vertical-align: middle;">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 80%; gap: 12px; padding-right: 10px;">
                  <span @click="openDetailModal(s)" style="cursor: pointer; color: var(--primary-color); word-break: break-all;">
                    {{ s.name }}
                  </span>
                  <span class="status-badge" :class="isOnline(s.last_active) ? 'online' : 'offline'" style="flex-shrink: 0;">
                    {{ isOnline(s.last_active) ? '在线' : '离线' }}
                  </span>
                </div>
              </td>
              
              <td style="color: var(--text-muted); font-family: monospace; font-size: 12px; line-height: 1.5; white-space: nowrap;">
                <div style="color: var(--text-main);">{{ s.ipv4 || '-' }}</div>
                <div v-if="s.ipv6" style="opacity: 0.7; font-size: 11px;">{{ s.ipv6 }}</div>
              </td>
              
              <td style="font-size: 16px; white-space: nowrap;" :title="s.region">{{ getFlagEmoji(s.region) }}</td>
              
              <td style="color: var(--text-muted); font-size: 13px; line-height: 1.5;">{{ s.notes || '-' }}</td>
              
              <td style="white-space: nowrap; color: var(--text-muted); font-size: 13px;">{{ s.billing_date || '-' }}</td>
              
              <td style="text-align: right; padding-right: 20px; white-space: nowrap;">
                <div class="action-icons" style="display: flex; gap: 8px; justify-content: flex-end;">
                  <button class="icon-btn" title="编辑节点" @click="openEditModal(s)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                  <button class="icon-btn" :title="s.is_hidden ? '取消隐藏' : '设为隐藏'" @click="toggleVisibility(s)">
                    <svg v-if="!s.is_hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  </button>
                  <button class="icon-btn" title="费用设置" @click="openCostModal(s)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg></button>
                  <button class="icon-btn" title="一键部署" @click="openDeployModal(s)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg></button>
                  <button class="icon-btn danger" title="删除节点" @click="confirmDeleteServer(s.node_id)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
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
      <div class="form-group">
        <label>安装 Token (只读)</label>
        <input type="text" :value="globalToken" readonly class="form-control" style="background: var(--bg-color); cursor: not-allowed;" />
      </div>
      <template #footer>
        <button class="btn-outline" @click="showAddModal = false">取消</button>
        <button class="btn-primary" @click="submitAddNode">保存</button>
      </template>
    </BaseModal>

    <BaseModal :show="showCostModal" :title="`费用设置: ${selectedServer?.name}`" @close="showCostModal = false">
      <div class="form-row" style="display: flex; gap: 12px;">
        <div class="form-group" style="flex: 2;">
          <label>费用</label>
          <input v-model="selectedServer.cost" type="number" step="0.01" placeholder="留空或0表示免费" class="form-control" />
        </div>
        <div class="form-group" style="flex: 1;">
          <label>货币</label>
          <select v-model="selectedServer.currency" class="form-control">
            <option value="CNY">CNY (¥)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button class="btn-outline" @click="showCostModal = false">取消</button>
        <button class="btn-primary" @click="saveCost">保存设置</button>
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
  <div style="line-height: 1.8; color: var(--text-main);">
    <p><strong>UUID:</strong> <code style="background: var(--bg-color); padding: 2px 6px;">{{ detailData.node_id }}</code></p>
    <p><strong>探针版本：</strong><span style="color: var(--text-muted);">{{ detailData.agent_version || '未知' }}</span></p> <p><strong>地区/分组：</strong>{{ detailData.region || '-' }}</p>
    <p><strong>标签/备注：</strong>{{ detailData.notes || '-' }}</p>
    <p><strong>系统：</strong>{{ detailData.os || '尚未上报' }}</p>
    <p><strong>最后在线：</strong>{{ detailData.last_active ? new Date(detailData.last_active * 1000).toLocaleString() : '离线' }}</p>
  </div>
  <template #footer>
    <button class="btn-primary" @click="showDetailModal = false">关闭</button>
  </template>
</BaseModal>


    <DeployModal :show="showDeployModal" :serverData="selectedServer" @close="showDeployModal = false" />
    <EditServerModal :show="showEditModal" :serverData="selectedServer" @close="showEditModal = false" @refresh="serverStore.fetchServers" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import request from '../../../utils/request.js' 
import { useServerStore } from '../../../store/server.js'

// 引入组件
import BaseModal from '../../common/BaseModal.vue'
import DeployModal from './DeployModal.vue'
import EditServerModal from './EditServerModal.vue'

const serverStore = useServerStore()

// 状态管理
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeployModal = ref(false)
const showCostModal = ref(false)
const showDeleteModal = ref(false)
const selectedServer = ref(null)
const nodeToDelete = ref(null)
const globalToken = ref('eyXXX_SERVER_TOKEN_XXX')

const newNode = ref({ name: '', group: '', tags: '' })

// 新增详情弹窗的状态
const showDetailModal = ref(false)
const detailData = ref({})

// 点击行或名称时触发
const openDetailModal = (s) => {
  detailData.value = s
  showDetailModal.value = true
}
// 工具函数
const getFlagEmoji = (code) => {
  if (!code || code === 'UN') return '🌐'
  return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)))
}
const isOnline = (ts) => (Date.now() / 1000) - ts < 180

// 业务逻辑
const openAddNodeModal = () => { newNode.value = { name: '', group: '', tags: '' }; showAddModal.value = true }
const openEditModal = (s) => { selectedServer.value = { ...s }; showEditModal.value = true }
const openCostModal = (s) => { selectedServer.value = { ...s, currency: s.currency || 'CNY' }; showCostModal.value = true }
const confirmDeleteServer = (id) => { nodeToDelete.value = id; showDeleteModal.value = true }

const submitAddNode = async () => {
  if (!newNode.value.name) {
    alert("节点名称不能为空");
    return;
  }
  
  try {
    const payload = {
      // 1. 修改这里：使用原生 API 生成标准 UUID
      node_id: crypto.randomUUID(), 
      name: newNode.value.name,
      region: newNode.value.group,   
      cost: 0,
      currency: "CNY",
      billing_date: "",
      monthly_bw: 0,
      bw_reset_day: 1,
      notes: newNode.value.tags      
    };

    await request.post('/api/admin/servers/save', payload);
    
    showAddModal.value = false;
    serverStore.fetchServers();
  } catch (err) {
    console.error("保存请求失败:", err);
  }
}
const saveCost = async () => { showCostModal.value = false; serverStore.fetchServers() }
const executeDelete = async () => { 
  await request.delete('/api/admin/servers/delete', { params: { node_id: nodeToDelete.value } })
  showDeleteModal.value = false; serverStore.fetchServers() 
}
const toggleVisibility = async (s) => { s.is_hidden = !s.is_hidden }
const openDeployModal = (s) => { selectedServer.value = { ...s }; showDeployModal.value = true }

onMounted(() => serverStore.startPolling(5000))
onUnmounted(() => serverStore.stopPolling())
</script>

<style scoped>
/* 状态标签 - 严格执行你提供的视觉参数 */
.status-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
}

/* 在线状态：RGBA(22, 163, 74, 0.1) */
.status-badge.online {
  background: rgba(22, 163, 74, 0.1);
  color: #16a34a;
}

/* 离线状态：建议对应使用淡红色 */
.status-badge.offline {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* 列表名称容器布局优化 */
.name-cell-wrapper {
  display: flex;
  align-items: center;
  gap: 8px; /* 🌟 核心修改：控制名称和状态的间距，不再推向两端 */
  width: fit-content; /* 确保容器只包裹内容 */
}

/* 调整表格整体列宽分配，防止某列被过度拉伸 */
table {
  table-layout: fixed; /* 强制执行固定比例 */
  width: 100%;
}
/* 仅保留列表专有的样式，弹窗外壳样式已在 BaseModal 中 */
.flex-header { display: flex; justify-content: space-between; align-items: center; }
.action-icons { display: flex; gap: 6px; justify-content: flex-end; }
.icon-btn { 
  background: transparent; border: 1px solid var(--border-color); border-radius: 6px; padding: 6px; 
  cursor: pointer; color: var(--text-muted); display: flex; align-items: center; 
}
.icon-btn:hover { color: var(--primary-color); border-color: var(--primary-color); }
.icon-btn.danger { color: #ef4444; }

/* 警告图标样式 */
.warning-icon-wrapper {
  width: 50px; height: 50px; border-radius: 50%; background: #fee2e2; 
  display: flex; align-items: center; justify-content: center; margin: 0 auto;
}
.warning-svg { width: 24px; height: 24px; color: #ef4444; }

.form-control {
  width: 100%; padding: 8px 12px; border: 1px solid var(--border-color);
  border-radius: 6px; font-size: 14px; outline: none;
}
</style>