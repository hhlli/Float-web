<template>
  <div class="view-section active">
    <div class="theme-grid">
      <div 
        v-for="theme in availableThemes" 
        :key="theme.id"
        class="theme-card"
        :class="{ 'is-active': currentTheme === theme.id }"
      >
        <div class="theme-info">
          <div class="flex-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <h3 class="section-title" style="margin: 0; font-size: 15px;">{{ theme.name }}</h3>
                <div v-if="currentTheme === theme.id" class="active-badge" style="padding: 2px 8px;">
                  <span class="pulse-dot"></span>
                  当前活动
                </div>
              </div>
              <span class="help-text" style="font-size: 12px; margin: 0; line-height: 1;">ID: {{ theme.id }}</span>
            </div>
            <span class="badge info" style="flex-shrink: 0;">v{{ theme.version || '1.0.0' }}</span>
          </div>

          <div class="theme-desc">
            <div class="desc-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              <span>设计者: <strong>{{ theme.author || '社区贡献' }}</strong></span>
            </div>
            <div class="desc-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span style="font-style: italic;">{{ theme.description || '暂无描述信息，这是一个简约而强大的监控主题。' }}</span>
            </div>
          </div>

          <div class="theme-actions">
            <button 
              v-if="currentTheme !== theme.id"
              @click="applyTheme(theme.id)"
              :disabled="isSaving"
              class="btn-primary"
              style="width: 100%; display: flex; justify-content: center; gap: 6px; padding: 6px 12px;"
            >
              <svg v-if="!isSaving" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
              {{ isSaving ? '部署中...' : '立即应用' }}
            </button>
            <div v-else style="display: flex; gap: 8px;">
              <button 
                disabled
                class="btn-outline"
                style="flex: 1; opacity: 0.6; cursor: not-allowed; display: flex; justify-content: center; gap: 6px; padding: 6px 12px;"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                运行中
              </button>
              <button 
                @click="showConfigModal = true"
                class="btn-outline"
                style="padding: 6px 12px; color: var(--primary-color); border-color: var(--primary-color);"
                title="主题动态参数配置"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="create-card-minimal" @click="showImportModal = true">
        <div class="icon-wrapper" title="导入新主题">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </div>
      </div>
    </div>

    <ThemeConfigModal 
      :show="showConfigModal" 
      @close="showConfigModal = false" 
    />
    <ImportThemeModal 
      :show="showImportModal" 
      @close="showImportModal = false" 
      @success="scanAvailableThemes" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { useSiteStore } from '@/store/site'
import { showToast } from '@/utils/toast.js'
import ThemeConfigModal from './ThemeConfigModal.vue'
import ImportThemeModal from './ImportThemeModal.vue'

const currentTheme = ref('default')
const availableThemes = ref([])
const isSaving = ref(false)
const siteStore = useSiteStore()

const showConfigModal = ref(false)
const showImportModal = ref(false)

const scanAvailableThemes = async () => {
  const themes = [
    { id: 'default', name: '系统默认', version: '1.0.0', author: 'Float', description: 'Float 监控的原生专业主题，平衡性能与美学。' },
    { id: 'matrix', name: 'Matrix', version: '1.0.0', author: 'Float', description: '基于数据矩阵布局的主题。' }
  ]
  try {
    const data = await request.get('/api/admin/settings/theme/list')
    if (Array.isArray(data)) {
      themes.push(...data)
    }
  } catch (e) {
    console.error('获取第三方主题列表失败', e)
  }
  availableThemes.value = themes
}

const loadCurrentTheme = async () => {
  try {
    const data = await request.get('/api/admin/settings/get')
    if (data && data.data && data.data.theme) {
      currentTheme.value = data.data.theme
    } else if (data && data.theme) {
      currentTheme.value = data.theme
    }
  } catch (e) { 
    console.error('获取主题配置失败:', e) 
  }
}

const applyTheme = async (id) => {
  if (isSaving.value) return
  isSaving.value = true
  try {
    await request.put('/api/admin/settings/theme', { theme: id })
    currentTheme.value = id
    siteStore.theme = id 
    showToast('主题切换成功', 'success')
    setTimeout(() => {
      window.location.reload()
    }, 600)
  } catch (e) {
    showToast('应用失败，请检查控制台', 'error')
  } finally { 
    isSaving.value = false 
  }
}

onMounted(() => {
  scanAvailableThemes()
  loadCurrentTheme()
})
</script>

<style scoped>
.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.theme-card {
  background: var(--surface-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.theme-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 8px 16px rgba(0,0,0,0.06); 
}

.theme-card.is-active {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.active-badge {
  background: rgba(16, 185, 129, 0.1);
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 600;
  color: #10b981;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  background-color: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  70% { box-shadow: 0 0 0 4px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.theme-info {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.theme-desc {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.desc-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
}

.desc-item svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--primary-color);
}

.theme-actions {
  border-top: 1px solid var(--border-color);
  padding-top: 12px;
}

.create-card-minimal {
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px; 
  cursor: pointer;
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-sm);
}

.create-card-minimal:hover .icon-wrapper {
  color: var(--primary-color);
  border-color: var(--primary-color);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}
</style>