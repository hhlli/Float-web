<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-card custom-width">
          <div class="card-header">全局一键部署</div>
          <div class="card-body">
            
            <div class="os-tabs">
              <div :class="['os-tab', { active: os === 'linux' }]" @click="os = 'linux'">Linux</div>
              <div :class="['os-tab', { active: os === 'windows' }]" @click="os = 'windows'">Windows</div>
              <div :class="['os-tab', { active: os === 'macos' }]" @click="os = 'macos'">macOS</div>
            </div>

            <div class="options-section">
              <h4 class="section-title">安装选项</h4>
              
              <div class="checkbox-grid">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="opts.disableRpc"> 禁用远程控制
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="opts.noUpdate"> 禁用自动更新
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="opts.insecure"> 忽略不安全证书
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="opts.includeBuffer"> 包含缓冲区内存
                </label>
              </div>

              <div class="input-grid">
                <div class="input-group">
                  <label>GitHub 代理</label>
                  <input type="text" v-model="opts.ghProxy" placeholder="例如: https://ghproxy.com/">
                </div>
                <div class="input-group">
                  <label>安装目录</label>
                  <input type="text" v-model="opts.installDir" placeholder="默认: /usr/local/bin">
                </div>
                <div class="input-group">
                  <label>服务名称</label>
                  <input type="text" v-model="opts.serviceName" placeholder="默认: go-probe">
                </div>
                <div class="input-group">
                  <label>只监测特定网卡</label>
                  <input type="text" v-model="opts.netInclude" placeholder="例如: eth0,eth1">
                </div>
                <div class="input-group">
                  <label>排除特定网卡</label>
                  <input type="text" v-model="opts.netExclude" placeholder="例如: docker0,veth">
                </div>
                <div class="input-group">
                  <label>只监测特定挂载点</label>
                  <input type="text" v-model="opts.diskMounts" placeholder="例如: /,/data">
                </div>
              </div>
            </div>

            <div class="cmd-box">
              <code>{{ deployCmd }}</code>
            </div>

            <div class="action-row" style="justify-content: space-between; margin-top: 24px; display: flex;">
              <button class="btn-outline" @click="$emit('close')">关闭</button>
              <button class="btn-primary" @click="copyCommand">
                {{ copySuccess ? '已复制 !' : '复制代码' }}
              </button>
            </div>

          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import request from '../../../utils/request.js'

defineEmits(['close'])

const props = defineProps({
  show: Boolean,
  serverData: Object
})

const copySuccess = ref(false)
const remoteAgentUrl = ref('')
const remoteToken = ref('')

// 当前选中的系统
const os = ref('linux')

// 🌟 选项状态绑定
const opts = ref({
  disableRpc: false,
  insecure: false,
  noUpdate: false,
  includeBuffer: false,
  ghProxy: '',
  installDir: '',
  serviceName: '',
  netInclude: '',
  netExclude: '',
  diskMounts: ''
})

const fetchSettings = async () => {
  try {
    const res = await request.get('/api/admin/settings/get')
    const responseData = res.data ? res.data : res
    if (responseData) {
      remoteAgentUrl.value = responseData.agent_url || ''
      remoteToken.value = responseData.server_token || ''
    }
  } catch (err) {
    console.error("获取配置失败:", err)
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    fetchSettings()
    // 每次打开弹窗时，重置为默认的 Linux 选项
    os.value = 'linux'
  }
})

onMounted(() => {
  fetchSettings()
})

// 🌟 核心修改：动态拼接参数
// 核心修改：动态拼接参数支持三端系统
const deployCmd = computed(() => {
  let hostStr = remoteAgentUrl.value || window.location.host
  if (hostStr.includes('5173')) {
    hostStr = hostStr.replace('5173', '8080')
  }

  const protocol = remoteAgentUrl.value.startsWith('https') ? 'https' : 'http'
  const cleanHost = hostStr.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const currentToken = remoteToken.value || localStorage.getItem('server_token') || 'your-token'
  
  // 1. 组装 Bash 语法标志位 (Linux & macOS 共用)
  let bashFlags = ''
  if (opts.value.disableRpc) bashFlags += ` --disable-rpc`
  if (opts.value.insecure) bashFlags += ` --insecure`
  if (opts.value.noUpdate) bashFlags += ` --no-update`
  if (opts.value.includeBuffer) bashFlags += ` --include-buffer`
  if (opts.value.ghProxy) bashFlags += ` --gh-proxy "${opts.value.ghProxy}"`
  if (opts.value.installDir) bashFlags += ` --dir "${opts.value.installDir}"`
  if (opts.value.serviceName) bashFlags += ` --service-name "${opts.value.serviceName}"`
  if (opts.value.netInclude) bashFlags += ` --net-include "${opts.value.netInclude}"`
  if (opts.value.netExclude) bashFlags += ` --net-exclude "${opts.value.netExclude}"`
  if (opts.value.diskMounts) bashFlags += ` --disk-mounts "${opts.value.diskMounts}"`

  let bashNodeId = ''
  if (props.serverData && props.serverData.node_id) {
    bashNodeId = ` -id "${props.serverData.node_id}"`
  }

  // 2. 根据系统类型输出最终命令
  if (os.value === 'linux') {
    return `curl -fsSL ${protocol}://${cleanHost}/install.sh -o install.sh && bash install.sh -t "${currentToken}" -s "${protocol}://${cleanHost}"${bashNodeId}${bashFlags}`
  } 
  
  if (os.value === 'macos') {
    return `curl -fsSL ${protocol}://${cleanHost}/install.mac.sh -o install.mac.sh && bash install.mac.sh -t "${currentToken}" -s "${protocol}://${cleanHost}"${bashNodeId}${bashFlags}`
  } 
  
  if (os.value === 'windows') {
    // 组装 PowerShell 语法标志位
    let psFlags = ''
    if (props.serverData && props.serverData.node_id) psFlags += ` -NodeId "${props.serverData.node_id}"`
    if (opts.value.disableRpc) psFlags += ` -DisableRpc`
    if (opts.value.insecure) psFlags += ` -Insecure`
    if (opts.value.noUpdate) psFlags += ` -NoUpdate`
    if (opts.value.includeBuffer) psFlags += ` -IncludeBuffer`
    if (opts.value.installDir) psFlags += ` -InstallDir "${opts.value.installDir}"`
    if (opts.value.serviceName) psFlags += ` -ServiceName "${opts.value.serviceName}"`
    
    return `Invoke-WebRequest -Uri "${protocol}://${cleanHost}/install.ps1" -OutFile "install.ps1"; .\\install.ps1 -Token "${currentToken}" -Server "${protocol}://${cleanHost}"${psFlags}`
  }
})

const copyCommand = async () => {
  // 移除对 os.value !== 'linux' 的 return 拦截
  try {
    await navigator.clipboard.writeText(deployCmd.value)
    copySuccess.value = true
    setTimeout(() => { copySuccess.value = false }, 2000)
  } catch (err) {
    alert("复制失败，请手动选择代码复制")
  }
}
</script>

<style scoped>
/* 适度加宽弹窗以容纳两列布局 */
.modal-card.custom-width {
  width: 90%;
  max-width: 640px; 
}

/* 操作系统 Tabs */
.os-tabs {
  display: flex;
  background: var(--bg-color, #f1f5f9);
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 24px;
}
.os-tab {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: 14px;
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
}
.os-tab.active {
  background: var(--surface-color, #ffffff);
  color: var(--text-main, #1e293b);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  font-weight: 500;
}

/* 选项区域标题 */
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

/* 复选框网格 (两列) */
.checkbox-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-main);
  cursor: pointer;
  user-select: none;
}
.checkbox-label input[type="checkbox"] {
  accent-color: var(--primary-color, #3b82f6);
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* 输入框网格 (两列) */
.input-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}
.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.input-group label {
  font-size: 12px;
  color: var(--text-muted);
}
.input-group input {
  padding: 8px 12px;
  font-size: 13px;
  border-radius: 6px;
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-color, #f8fafc);
  color: var(--text-main, #1e293b);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.input-group input:focus {
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* 命令输出框 */
.cmd-box { 
  background: var(--bg-color, #f8fafc); 
  border-radius: 8px; 
  padding: 16px; 
  overflow-x: auto; 
  border: 1px solid var(--border-color, #e2e8f0); 
}
.cmd-box code { 
  color: var(--primary-color, #3b82f6); 
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; 
  font-size: 13px; 
  line-height: 1.5; 
  white-space: pre-wrap; 
  word-break: break-all; 
}
</style>