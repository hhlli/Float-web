<template>
  <div class="server-panel">
    <button class="panel-close" @click="$emit('close')">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>

    <div class="panel-header">
      <h2 class="panel-name">NODE_LIST</h2>
      <div class="panel-ip">TOTAL: {{ servers.length }}</div>
    </div>

    <div class="panel-divider"></div>

    <div class="list-container">
      <div 
        v-for="s in servers" 
        :key="s.node_id" 
        :id="'node-' + s.node_id" class="list-item-group"
        :class="{ 'is-expanded': expandedId === s.node_id }"
      >
        <div class="list-item" @click="toggleExpand(s.node_id)">
          <div class="item-main">
            <span class="status-dot" :class="isOnline(s) ? 'online' : 'offline'"></span>
            <span class="server-name">{{ s.name }}</span>
          </div>
          <button class="detail-link-btn" @click.stop="$emit('select', s)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="4 17 10 11 4 5"></polyline>
              <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
          </button>
        </div>

        <div class="detail-wrapper">
          <div class="detail-inner">
            <ServerDetailContent 
              :server="s" 
              @collapse="expandedId = null" 
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import ServerDetailContent from './ServerDetailContent.vue'

const props = defineProps({
  servers: { type: Array, default: () => [] },
  onlineThreshold: { type: Number, default: 180 },
  selectedNodeId: { type: String, default: null }
})

defineEmits(['close', 'select'])

const expandedId = ref(null)

watch(() => props.selectedNodeId, (newId) => {
  if (newId) {
    expandedId.value = newId
    nextTick(() => {
      const el = document.getElementById('node-' + newId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    })
  }
}, { immediate: true })

const toggleExpand = (id) => {
  if (expandedId.value === id) {
    expandedId.value = null
  } else {
    expandedId.value = id
  }
}

const isOnline = (s) => {
  if (!s.last_active) return false
  return (Date.now() / 1000 - s.last_active) < props.onlineThreshold
}
</script>

<style scoped>
.server-panel {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 320px;
  background: rgba(2, 14, 26, 0.96);
  border-right: 1px solid #00ff8820;
  padding: 28px 24px;
  z-index: 30;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(12px);
  box-shadow: 4px 0 32px rgba(0, 255, 136, 0.04);
}

.panel-close { position: absolute; top: 16px; right: 16px; background: transparent; border: 1px solid #00ff8822; color: #3a7a55; width: 28px; height: 28px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; z-index: 50; }
.panel-close:hover { border-color: #ff4455; color: #ff4455; }
.panel-header { padding-bottom: 8px; }
.panel-name { font-family: 'Courier New', monospace; font-size: 20px; font-weight: 700; color: #00ff88; margin: 0 0 6px; letter-spacing: 0.05em; }
.panel-ip { font-family: 'Courier New', monospace; font-size: 12px; color: #2a5a40; letter-spacing: 0.08em; }
.panel-divider { height: 1px; background: linear-gradient(90deg, #00ff8818, transparent); margin: 16px 0; flex-shrink: 0; }

.list-container { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 4px; perspective: 1000px; }
.list-container::-webkit-scrollbar { width: 4px; }
.list-container::-webkit-scrollbar-track { background: transparent; }
.list-container::-webkit-scrollbar-thumb { background: #00ff8833; border-radius: 2px; }

.list-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: rgba(0, 255, 136, 0.03); border: 1px solid transparent; border-radius: 4px; cursor: pointer; transition: all 0.2s; }
.list-item:hover { background: rgba(0, 255, 136, 0.08); border-color: #00ff8844; }
.item-main { display: flex; align-items: center; gap: 10px; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; }
.status-dot.online { background: #00ff88; box-shadow: 0 0 6px #00ff88; }
.status-dot.offline { background: #ff4455; }
.server-name { font-family: 'Courier New', monospace; font-size: 13px; color: #a0ffcc; font-weight: 600; }

/* 🌟 新增：详情进入按钮样式 */
.detail-link-btn {
  background: transparent;
  border: 1px solid #00ff8822;
  color: #3a7a55;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.detail-link-btn:hover {
  border-color: #00ff88;
  color: #00ff88;
  box-shadow: 0 0 8px rgba(0, 255, 136, 0.3);
}

.list-item-group { display: flex; flex-direction: column; }
.detail-wrapper { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.is-expanded .detail-wrapper { grid-template-rows: 1fr; }
.detail-inner { overflow: hidden; transform-origin: top; transform: rotateX(-90deg); opacity: 0; transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease; }
.is-expanded .detail-inner { transform: rotateX(0deg); opacity: 1; }

@media (max-width: 768px) {
  .server-panel { width: 100%; top: auto; bottom: 0; height: 55vh; border-right: none; border-top: 1px solid #00ff8820; }
}
</style>