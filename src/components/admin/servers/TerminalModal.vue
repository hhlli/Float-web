<template>
  <Teleport to="body">
    <transition name="terminal-fade">
      <div v-if="visible" class="terminal-overlay" @click.self="closeModal">
        <div class="terminal-window" :style="{ transform: `translate(${position.x}px, ${position.y}px)` }">
          
          <div class="terminal-header" @mousedown="startDrag" style="cursor: move;">
            <div class="terminal-title">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
              <span>远程终端 - {{ nodeName || nodeId }}</span>
            </div>
            <button class="terminal-close-btn" @mousedown.stop @click="closeModal" title="关闭终端">×</button>
          </div>
          
          <div class="terminal-body">
            <div ref="terminalRef" class="terminal-container"></div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import request from '@/utils/request.js' // 新增此行

const props = defineProps({
  visible: { type: Boolean, default: false },
  nodeId: { type: String, required: true },
  nodeName: { type: String, default: '' } // 🌟 新增接收名称
})

const emit = defineEmits(['update:visible'])

const terminalRef = ref(null)
let term = null
let fitAddon = null
let ws = null

const closeModal = () => {
  emit('update:visible', false)
}

// ─── 🌟 拖拽逻辑 ──────────────────────────────────
const position = ref({ x: 0, y: 0 })
let isDragging = false
let startMousePos = { x: 0, y: 0 }

const startDrag = (e) => {
  isDragging = true
  // 记录鼠标按下时的初始偏移
  startMousePos = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  }
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

const onDrag = (e) => {
  if (!isDragging) return
  // 计算新的偏移量
  position.value = {
    x: e.clientX - startMousePos.x,
    y: e.clientY - startMousePos.y
  }
}

const stopDrag = () => {
  isDragging = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}
// ────────────────────────────────────────────────

const initTerminal = async () => {
  if (term) return

  term = new Terminal({
    cursorBlink: true,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    fontSize: 14,
    theme: {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      cursor: '#ffffff',
      selectionBackground: '#444444'
    }
  })

  fitAddon = new FitAddon()
  term.loadAddon(fitAddon)
  term.open(terminalRef.value)
  fitAddon.fit()

  try {
    // 1. 发起标准 HTTP 请求获取一次性 Ticket
    // 此请求会被 request.js 拦截器自动加上 Authorization: Bearer <token>
    const res = await request.get(`/api/admin/terminal/ticket?node_id=${props.nodeId}`)

    if (!res || !res.ticket) {
      throw new Error("Invalid ticket response")
    }

    // 2. 使用短效 Ticket 建立 WebSocket 连接
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/terminal/ws?node_id=${props.nodeId}&ticket=${res.ticket}`

    ws = new WebSocket(wsUrl)
    ws.binaryType = 'arraybuffer'

    ws.onopen = () => {
      term.focus()
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'resize',
          cols: term.cols,
          rows: term.rows
        }))
      }
    }

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        term?.write(new Uint8Array(event.data))
      } else {
        term?.write(event.data)
      }
    }

    ws.onerror = () => {
      term?.write('\r\n[Error] WebSocket 连接异常\r\n')
    }

    ws.onclose = () => {
      term?.write('\r\n[Info] 连接已断开\r\n')
    }

    term.onData(data => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(data)
      }
    })

    term.onResize(size => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'resize',
          cols: size.cols,
          rows: size.rows
        }))
      }
    })

    window.addEventListener('resize', handleResize)

  } catch (error) {
    term.write('\r\n[Error] 获取终端鉴权凭证失败，连接终止。\r\n')
    console.error("Terminal Ticket Error:", error)
  }
}

const handleResize = () => {
  if (fitAddon) {
    fitAddon.fit()
  }
}

const destroyTerminal = () => {
  window.removeEventListener('resize', handleResize)
  if (ws) {
    ws.close()
    ws = null
  }
  if (term) {
    term.dispose()
    term = null
    fitAddon = null
  }
}

watch(() => props.visible, (newVal) => {
  if (newVal && props.nodeId) {
    position.value = { x: 0, y: 0 } // 🌟 每次打开弹窗时，将位置重置回屏幕正中央
    setTimeout(() => {
      if (terminalRef.value) {
        initTerminal()
      }
    }, 150)
  } else {
    destroyTerminal()
  }
})

onBeforeUnmount(() => {
  destroyTerminal()
  // 组件销毁时确保移除全局拖拽事件
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})
</script>

<style scoped>
.terminal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.45); /* 调浅了背景颜色 */
  /* 🌟 去掉了 backdrop-filter: blur，取消毛玻璃效果 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.terminal-window {
  background-color: #1e1e1e;
  border: 1px solid #333;
  border-radius: 8px;
  width: 80vw;
  max-width: 1400px;
  height: 65vh;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
  overflow: hidden;
  /* 🌟 确保 transform 切换时平滑，但拖拽时不加动画防止卡顿 */
  will-change: transform;
}

.terminal-header {
  background-color: #2d2d2d;
  height: 40px;
  padding: 0 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #111;
  user-select: none; /* 防止拖拽时选中文字 */
}

.terminal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #a0a0a0;
  font-size: 13px;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
}

.terminal-close-btn {
  background: transparent;
  border: none;
  color: #888;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
  transition: color 0.2s;
}

.terminal-close-btn:hover {
  color: #fff;
}

.terminal-body {
  flex: 1;
  padding: 12px 12px 12px 16px;
  background-color: #1e1e1e;
  overflow: hidden;
}

.terminal-container {
  width: 100%;
  height: 100%;
}

.terminal-fade-enter-active,
.terminal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.terminal-fade-enter-from,
.terminal-fade-leave-to {
  opacity: 0;
}
</style>