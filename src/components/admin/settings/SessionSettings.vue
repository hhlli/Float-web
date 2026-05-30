<template>
  <div class="card">
    <div class="card-body">
      <div class="form-section" style="border-bottom: none; margin-bottom: 0; padding-bottom: 0;">
        <h3 class="section-title">会话管理</h3>
        
        <div class="table-container">
          <table class="session-table">
            <thead>
              <tr>
                <th>状态</th>
                <th>IP 地址</th>
                <th>客户端 (UA)</th>
                <th>登录时间</th>
                <th>最后活跃</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="session in sessions" :key="session.token">
                <td>
                  <span v-if="session.is_current" class="badge current">当前设备</span>
                  <span v-else class="badge active">在线</span>
                </td>
                <td>{{ session.ip || '未知' }}</td>
                <td class="ua-cell" :title="session.user_agent">{{ formatUA(session.user_agent) }}</td>
                <td>{{ formatDate(session.created_at) }}</td>
                <td>{{ formatDate(session.last_active) }}</td>
                <td>
                  <button 
                    v-if="!session.is_current"
                    class="btn-outline btn-sm btn-danger" 
                    @click="revokeSession(session.token)"
                  >
                    强制下线
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request.js'
import { showToast } from '@/utils/toast.js'

const sessions = ref([])

const loadSessions = async () => {
  try {
    const data = await request.get('/api/admin/sessions')
    sessions.value = data || []
  } catch (e) {
    console.error('获取会话失败:', e)
  }
}

const revokeSession = async (token) => {
  if (!confirm('确定要强制该设备下线吗？')) return
  
  try {
    await request.post('/api/admin/sessions/revoke', { token })
    showToast('已强制下线', 'success')
    loadSessions()
  } catch (e) {
    showToast('操作失败', 'error')
  }
}

const formatUA = (ua) => {
  if (!ua) return '未知'

  // 1. 识别操作系统
  let os = '未知系统'
  if (ua.includes('Macintosh') || ua.includes('Mac OS X')) os = 'macOS'
  else if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11'
  else if (ua.includes('Windows NT')) os = 'Windows'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  else if (ua.includes('Linux')) os = 'Linux'

  // 2. 识别浏览器及完整版本号
  let browser = '未知浏览器'
  if (ua.includes('Edg/')) {
    const match = ua.match(/Edg\/([\d.]+)/)
    browser = match ? `Edge/${match[1]}` : 'Edge'
  } else if (ua.includes('Chrome/')) {
    const match = ua.match(/Chrome\/([\d.]+)/)
    browser = match ? `Chrome/${match[1]}` : 'Chrome'
  } else if (ua.includes('Firefox/')) {
    const match = ua.match(/Firefox\/([\d.]+)/)
    browser = match ? `Firefox/${match[1]}` : 'Firefox'
  } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
    const match = ua.match(/Version\/([\d.]+)/)
    browser = match ? `Safari/${match[1]}` : 'Safari'
  }

  if (os === '未知系统' && browser === '未知浏览器') {
    return ua.length > 30 ? ua.substring(0, 30) + '...' : ua
  }

  return `${os} ${browser}`
}

const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  const d = new Date(timestamp * 1000)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

onMounted(() => {
  loadSessions()
})
</script>

<style scoped>

.table-container { 
  overflow-x: auto; /* 修改：开启横向滚动条 */
  border: 1px solid var(--border-color); 
  border-radius: 8px; 
}
.session-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }

.session-table th, .session-table td { 
  padding: 12px 16px; 
  border-bottom: 1px solid var(--border-color); 
  white-space: nowrap; /* 新增：禁止文字挤压换行 */
}
.session-table th { 
  background: var(--bg-color); 
  font-weight: 500; 
  color: var(--text-muted); 
}
.session-table tr:last-child td { border-bottom: none; }

.ua-cell { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: default; }

.badge { padding: 2px 8px; border-radius: 12px; font-size: 12px; }
.badge.current { 
  background: rgba(59, 130, 246, 0.15); 
  color: #3b82f6; 
}
.badge.active { 
  background: rgba(16, 185, 129, 0.15); 
  color: #10b981; 
}

.btn-sm { padding: 4px 12px; font-size: 12px; cursor: pointer; }
.btn-danger { color: #ef4444; border-color: #ef4444; background: transparent; }
.btn-danger:hover:not(:disabled) { 
  background: rgba(239, 68, 68, 0.1); 
}
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; border-color: #d1d5db; color: #9ca3af; }
</style>