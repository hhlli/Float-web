<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-card custom-width">
          <div class="card-header">卸载探针端</div>
          <div class="card-body">
            
            <div class="os-tabs">
              <div :class="['os-tab', { active: os === 'linux' }]" @click="os = 'linux'">Linux</div>
              <div :class="['os-tab', { active: os === 'windows' }]" @click="os = 'windows'">Windows</div>
              <div :class="['os-tab', { active: os === 'macos' }]" @click="os = 'macos'">macOS</div>
            </div>

            <div class="options-section">
              <p style="color: var(--text-main); font-size: 14px; margin-bottom: 16px;">
                请在对应终端内分两步进行清理：
              </p>

              <div class="step-label">{{ step1Text }}</div>
              <div class="cmd-box" v-if="step1Cmd">
                <code>{{ step1Cmd }}</code>
              </div>

              <div class="step-label" style="margin-top: 16px;">{{ step2Text }}</div>
              <div class="cmd-box">
                <code>{{ step2Cmd }}</code>
              </div>
            </div>

            <div class="action-row" style="justify-content: space-between; margin-top: 24px; display: flex;">
              <button class="btn-outline" @click="$emit('close')">关闭</button>
              <button class="btn-primary" @click="copyCommand">
                {{ copySuccess ? '已复制 !' : '复制卸载命令' }}
              </button>
            </div>

          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { showToast } from '@/utils/toast.js'

defineEmits(['close'])

const props = defineProps({
  show: Boolean,
  serverData: Object
})

const copySuccess = ref(false)
const os = ref('linux')

watch(() => props.show, (newVal) => {
  if (newVal) os.value = 'linux'
})

const step1Text = computed(() => {
  if (os.value === 'windows') {
    return '1. 请在开始菜单右键，选择“Windows PowerShell (管理员)”或“终端 (管理员)”打开新窗口'
  }
  return '1. 获取 root 权限 (执行后需输入密码)'
})

const step1Cmd = computed(() => {
  if (os.value === 'windows') return ''
  return 'sudo -i'
})

const step2Text = computed(() => '2. 粘贴并执行卸载命令')

const step2Cmd = computed(() => {
  if (os.value === 'linux') {
    return 'systemctl stop float-agent 2>/dev/null; systemctl disable float-agent 2>/dev/null; rm -f /etc/systemd/system/float-agent.service; systemctl daemon-reload; rm -f /usr/local/bin/float-agent; rm -rf /opt/float-agent; rm -rf /etc/float-agent; echo "Float Agent (Linux) 已彻底卸载"'
  } 
  
  if (os.value === 'macos') {
    return 'launchctl bootout system /Library/LaunchDaemons/com.float.agent.plist 2>/dev/null; rm -f /Library/LaunchDaemons/com.float.agent.plist; rm -f /usr/local/bin/float-agent; rm -rf /opt/float-agent; rm -rf /etc/float-agent; echo "Float Agent (macOS) 已彻底卸载"'
  } 
  
  if (os.value === 'windows') {
    return 'Stop-Service -Name "float-agent" -ErrorAction SilentlyContinue; sc.exe delete "float-agent"; Remove-Item -Path "C:\\Program Files\\FloatAgent" -Recurse -Force -ErrorAction SilentlyContinue; Write-Host "Float Agent (Windows) 已彻底卸载"'
  }
})

const copyCommand = async () => {
  try {
    await navigator.clipboard.writeText(step2Cmd.value)
    copySuccess.value = true
    setTimeout(() => { copySuccess.value = false }, 2000)
  } catch (err) {
    showToast("复制失败，请手动选择代码复制", "error")
  }
}
</script>

<style scoped>
.modal-card.custom-width { width: 90%; max-width: 640px; }
.os-tabs { display: flex; background: var(--bg-color); border-radius: 8px; padding: 4px; margin-bottom: 24px; }
.os-tab { flex: 1; text-align: center; padding: 8px 0; font-size: 14px; color: var(--text-muted); cursor: pointer; border-radius: 6px; transition: all 0.2s ease; }
.os-tab.active { background: var(--surface-color); color: var(--text-main); box-shadow: 0 2px 4px rgba(0,0,0,0.05); font-weight: 500; }
.options-section { margin-bottom: 24px; }
.step-label { font-size: 13px; color: var(--text-main); margin-bottom: 8px; font-weight: 500; }
.cmd-box { background: var(--bg-color); border-radius: 8px; padding: 16px; overflow-x: auto; border: 1px solid var(--border-color); }
.cmd-box code { color: var(--primary-color); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; line-height: 1.5; white-space: pre-wrap; word-break: break-all; }
</style>