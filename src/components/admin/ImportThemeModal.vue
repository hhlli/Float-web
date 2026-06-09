<template>
  <BaseModal 
    :show="show" 
    title="导入新主题" 
    @close="closeModal"
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
      <button class="btn-outline" @click="closeModal">取消</button>
      <button v-if="importMode === 'github'" @click="installFromGithub" :disabled="isInstalling || !githubUrl" class="btn-primary">
        {{ isInstalling ? '拉取中...' : '确认拉取' }}
      </button>
      <button v-else @click="uploadZipTheme" :disabled="isUploading || !selectedFile" class="btn-primary">
        {{ isUploading ? '上传中...' : '确认上传' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref } from 'vue'
import request from '@/utils/request'
import { showToast } from '@/utils/toast.js'
import BaseModal from '@/components/common/BaseModal.vue'

const props = defineProps({ show: Boolean })
const emit = defineEmits(['close', 'success'])

const importMode = ref('github')

const githubUrl = ref('')
const isInstalling = ref(false)

const installFromGithub = async () => {
  if (!githubUrl.value || isInstalling.value) return
  isInstalling.value = true
  try {
    await request.post('/api/admin/settings/theme/install', { url: githubUrl.value })
    showToast('主题拉取成功', 'success')
    githubUrl.value = ''
    emit('success') 
    closeModal()
  } catch (e) {
    showToast(e.response?.data?.message || e.message || '安装失败', 'error')
  } finally {
    isInstalling.value = false
  }
}

const fileInput = ref(null)
const selectedFile = ref(null)
const selectedFileName = ref('')
const isUploading = ref(false)

const triggerFileInput = () => fileInput.value?.click()

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
    emit('success') 
    closeModal()
  } catch (e) {
    showToast(e.response?.data?.message || e.message || '上传解压失败', 'error')
  } finally {
    isUploading.value = false
  }
}

const closeModal = () => emit('close')
</script>

<style scoped>
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
.tab-btn:hover { color: var(--text-main); }
.tab-btn.active {
  background: var(--surface-color);
  color: var(--text-main);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.upload-area:hover {
  border-color: var(--primary-color) !important;
  background: rgba(59, 130, 246, 0.03) !important;
}
</style>