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
            <button 
              v-else
              disabled
              class="btn-outline"
              style="width: 100%; opacity: 0.6; cursor: not-allowed; display: flex; justify-content: center; gap: 6px; padding: 6px 12px;"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              已在运行
            </button>
          </div>
        </div>
      </div>

      <div class="theme-card create-card">
        <div class="icon-wrapper">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
        </div>
        <h3 class="section-title" style="margin-bottom: 6px; font-size: 15px;">开发新主题</h3>
        <p class="help-text" style="text-align: center; line-height: 1.4; font-size: 12px;">在 themes/ 目录下<br>新建文件夹即可识别</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { useSiteStore } from '@/store/site'
import { showToast } from '@/utils/toast.js'

const currentTheme = ref('default')
const availableThemes = ref([])
const isSaving = ref(false)
const siteStore = useSiteStore()

const scanAvailableThemes = () => {
  const themeFiles = import.meta.glob('../../themes/*/theme.json', { eager: true })
  const themes = []
  
  for (const path in themeFiles) {
    const themeId = path.split('/')[3]
    const themeData = themeFiles[path].default || themeFiles[path]
    themes.push({
      id: themeId,
      name: themeData.name || themeId,
      version: themeData.version,
      author: themeData.author,
      description: themeData.description
    })
  }
  
  if (!themes.find(t => t.id === 'default')) {
    themes.push({ id: 'default', name: '系统默认', version: '1.0.0', author: 'Float', description: 'Float 监控的原生专业主题，平衡性能与美学。' })
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
    
    // 必须强制刷新以清除旧组件与 CSS 的内存缓存
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

.create-card {
  border: 2px dashed var(--border-color);
  background: transparent;
  box-shadow: none;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  cursor: pointer;
}

.create-card:hover {
  border-color: var(--primary-color);
  background: rgba(59, 130, 246, 0.03);
  /* 已移除 transform: translateY(-2px); 修复遮挡上边缘问题 */
  box-shadow: none;
}

.icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  color: var(--text-muted);
  transition: all 0.2s ease;
}

.create-card:hover .icon-wrapper {
  color: var(--primary-color);
  border-color: var(--primary-color);
  transform: scale(1.1);
}
</style>