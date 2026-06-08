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

      <div class="create-card-minimal" @click="showImportModal = true">
        <div class="icon-wrapper" title="导入新主题">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </div>
      </div>
    </div>

    <BaseModal 
      :show="showImportModal" 
      title="导入新主题" 
      @close="showImportModal = false"
    >
      <div class="form-group" style="margin-bottom: 16px;">
        <div class="import-tabs" style="display: flex; gap: 8px; background: var(--bg-color); padding: 4px; border-radius: 8px;">
          <button class="tab-btn" :class="{ active: importMode === 'github' }" @click="importMode = 'github'">GitHub 拉取</button>
          <button class="tab-btn" :class="{ active: importMode === 'zip' }" @click="importMode = 'zip'">ZIP 上传</button>
        </div>
      </div>

      <div v-if="importMode === 'github'" class="form-group">
        <label>仓库地址</label>
        <input 
          v-model="githubUrl" 
          type="text" 
          placeholder="https://github.com/user/repo" 
          class="form-control" 
        />
      </div>

      <div v-else class="form-group">
        <label>主题压缩包</label>
        <div 
          @click="triggerFileInput" 
          class="form-control"
          style="cursor: pointer; display: flex; align-items: center; gap: 8px; background: var(--bg-color); transition: border-color 0.2s;"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted); flex-shrink: 0;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <span :style="{ color: selectedFileName ? 'var(--text-main)' : 'var(--text-muted)' }" style="font-size: 13px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            {{ selectedFileName || '点击选择 .zip 格式的主题包' }}
          </span>
        </div>
        <input type="file" ref="fileInput" accept=".zip" style="display: none" @change="handleFileChange" />
      </div>

      <template #footer>
        <button class="btn-outline" @click="showImportModal = false">取消</button>
        <button v-if="importMode === 'github'" @click="installFromGithub" :disabled="isInstalling || !githubUrl" class="btn-primary">
          {{ isInstalling ? '拉取中...' : '确认拉取' }}
        </button>
        <button v-else @click="uploadZipTheme" :disabled="isUploading || !selectedFile" class="btn-primary">
          {{ isUploading ? '上传中...' : '确认上传' }}
        </button>
      </template>
    </BaseModal>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { useSiteStore } from '@/store/site'
import { showToast } from '@/utils/toast.js'
import BaseModal from '@/components/common/BaseModal.vue'

const currentTheme = ref('default')
const availableThemes = ref([])
const isSaving = ref(false)
const siteStore = useSiteStore()

const importMode = ref('github') // 切换 github 和 zip
const githubUrl = ref('')
const isInstalling = ref(false)
const showImportModal = ref(false)

// 文件上传相关变量
const fileInput = ref(null)
const selectedFile = ref(null)
const selectedFileName = ref('')
const isUploading = ref(false)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file && file.name.toLowerCase().endsWith('.zip')) {
    selectedFile.value = file
    selectedFileName.value = file.name
  } else {
    showToast('请选择 .zip 格式的文件', 'error')
    e.target.value = ''
  }
}

const uploadZipTheme = async () => {
  if (!selectedFile.value) return
  isUploading.value = true
  
  const formData = new FormData()
  formData.append('file', selectedFile.value)

  try {
    await request.post('/api/admin/settings/theme/upload', formData)
    showToast('ZIP 主题上传并解析成功', 'success')
    
    selectedFile.value = null
    selectedFileName.value = ''
    if (fileInput.value) fileInput.value.value = ''
    
    // 关闭弹窗
    showImportModal.value = false
    await scanAvailableThemes()
  } catch (e) {
    showToast(e.response?.data?.message || e.message || '上传解压失败', 'error')
  } finally {
    isUploading.value = false
  }
}

const scanAvailableThemes = async () => {
  // 定义内置主题
  const themes = [
    { id: 'default', name: '系统默认', version: '1.0.0', author: 'Float', description: 'Float 监控的原生专业主题，平衡性能与美学。' },
    { id: 'matrix', name: 'Matrix', version: '1.0.0', author: 'Float', description: '基于数据矩阵布局的主题。' }
  ]
  
  // 获取远端拉取的第三方主题
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

const installFromGithub = async () => {
  if (!githubUrl.value || isInstalling.value) return
  isInstalling.value = true
  try {
    await request.post('/api/admin/settings/theme/install', { url: githubUrl.value })
    showToast('主题拉取成功', 'success')
    githubUrl.value = ''
    
    // 关闭弹窗
    showImportModal.value = false
    await scanAvailableThemes() 
  } catch (e) {
    showToast(e.response?.data?.message || e.message || '安装失败', 'error')
  } finally {
    isInstalling.value = false
  }
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

.tab-btn {
  flex: 1;
  padding: 6px 0;
  text-align: center;
  border-radius: 6px;
  border: none;
  background: transparent;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: var(--text-main);
}

.tab-btn.active {
  background: var(--surface-color);
  color: var(--text-main);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.upload-area:hover {
  border-color: var(--primary-color) !important;
  background: rgba(59, 130, 246, 0.03) !important;
}

/* 极简触发卡片样式 */
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