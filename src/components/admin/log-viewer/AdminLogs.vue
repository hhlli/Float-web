<template>
  <div class="view-section active">
    <div class="card">
      <div class="card-body">
        
        <div class="flex-header">
          <h3 class="section-title">系统运行日志</h3>
          <div class="header-actions">
            <div class="filter-wrapper">
              <select v-model="filterLevel" class="form-control select-sm">
                <option value="">全部级别</option>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="ERROR">ERROR</option>
              </select>
            </div>

            <button class="btn-primary btn-sm" @click="fetchLogs" :disabled="loading">
              <svg v-if="loading" class="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
              {{ loading ? '刷新中...' : '刷新日志' }}
            </button>
          </div>
        </div>
        
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th class="col-time">时间</th>
                <th class="col-level">级别</th>
                <th>日志内容</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredLogs.length === 0">
                <td colspan="3" class="empty-cell">
                  {{ loading ? '正在读取日志...' : '无匹配的系统日志' }}
                </td>
              </tr>
              <tr v-for="(log, index) in filteredLogs" :key="index">
                <td class="log-time">
                  {{ formatTime(log.timestamp) }}
                </td>
                <td>
                  <span class="badge" :class="levelClass(log.level)">{{ log.level }}</span>
                </td>
                <td class="log-message">
                  {{ log.message }}
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
import { ref, onMounted, computed } from 'vue'
import request from '@/utils/request.js'

const logs = ref([])
const loading = ref(false)
const filterLevel = ref('')

const filteredLogs = computed(() => {
  if (!filterLevel.value) return logs.value
  return logs.value.filter(log => (log.level || '').toUpperCase() === filterLevel.value)
})

const fetchLogs = async () => {
  loading.value = true
  try {
    const data = await request.get('/api/admin/logs')
    logs.value = data || []
  } catch (e) {
    console.error('获取日志失败:', e)
  } finally {
    loading.value = false
  }
}

const formatTime = (ts) => {
  if (!ts) return '-'
  const d = new Date(ts * 1000)
  const pad = (n) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const levelClass = (level) => {
  const lower = (level || '').toLowerCase()
  if (lower === 'error') return 'offline' 
  if (lower === 'warning') return 'warning' 
  return 'info' 
}

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
/* 头部布局 */
.header-actions { display: flex; gap: 12px; align-items: center; }
.filter-wrapper { display: flex; align-items: center; gap: 6px; color: var(--text-muted); }

/* 覆盖全局 form-control 的局部小尺寸适配 */
.select-sm { width: auto; padding: 6px 10px; font-size: 13px; min-width: 100px; }
.btn-sm { display: flex; align-items: center; padding: 6px 12px; font-size: 13px; }

/* 表格列宽控制 */
.col-time { width: 180px; }
.col-level { width: 100px; }

/* 单元格内容样式 */
.empty-cell { text-align: center; color: var(--text-muted); padding: 30px; }
.log-time { color: var(--text-muted); font-size: 13px; }
.log-message { 
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; 
  font-size: 13px; 
  color: var(--text-main); 
}

/* 补充全局缺少的 Warning 徽章样式 */
.badge.warning {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
}

/* 动画与图标 */
.spin-icon { width: 14px; height: 14px; margin-right: 6px; animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
</style>