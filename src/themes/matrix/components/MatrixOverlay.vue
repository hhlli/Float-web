<template>
  <div class="matrix-overlay-container">
    <div class="list-action-corner" v-if="!isOpen">
      <button class="matrix-icon-btn" @click="$emit('toggle-list')" title="展开面板">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="13 17 18 12 13 7"></polyline>
          <polyline points="6 17 11 12 6 7"></polyline>
        </svg>
      </button>
    </div>

    <div class="map-title">
      <span class="title-bracket">[</span>
      <span class="title-text">{{ siteName || 'NODE MONITOR' }}</span>
      <span class="title-bracket">]</span>
      <span class="title-blink">_</span>
    </div>

    <div class="admin-action-corner">
      <button class="matrix-admin-btn" @click="$emit('open-admin')">
        <span class="btn-bracket">[</span>
        <span class="btn-text">SYSTEM_LOGIN</span>
        <span class="btn-bracket">]</span>
      </button>
    </div>

    <div class="map-stats">
      <div class="stat-item">
        <span class="stat-dot online"></span>
        <span class="stat-label">{{ onlineCount }} ONLINE</span>
      </div>
      <div class="stat-item">
        <span class="stat-dot offline"></span>
        <span class="stat-label">{{ offlineCount }} OFFLINE</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  siteName: { type: String, default: '' },
  onlineCount: { type: Number, default: 0 },
  offlineCount: { type: Number, default: 0 },
  isOpen: { type: Boolean, default: false }
})

defineEmits(['open-admin', 'toggle-list'])
</script>

<style scoped>
.matrix-overlay-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.list-action-corner {
  position: absolute;
  top: 20px;
  left: 24px;
  pointer-events: auto;
  z-index: 20;
}

.matrix-icon-btn {
  background: rgba(2, 14, 26, 0.6);
  border: 1px solid #00ff8844;
  color: #00ff88;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  backdrop-filter: blur(4px);
  transition: all 0.2s ease;
}

.matrix-icon-btn:hover {
  background: rgba(0, 255, 136, 0.15);
  border-color: #00ff88;
  box-shadow: 0 0 12px rgba(0, 255, 136, 0.3);
}

.admin-action-corner { position: absolute; top: 20px; right: 24px; pointer-events: auto; z-index: 20; }
.matrix-admin-btn { background: rgba(2, 14, 26, 0.6); border: 1px solid #00ff8844; color: #00aa55; font-family: 'Courier New', monospace; font-size: 11px; padding: 6px 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s ease; backdrop-filter: blur(4px); }
.matrix-admin-btn:hover { background: rgba(0, 255, 136, 0.1); border-color: #00ff88; color: #00ff88; box-shadow: 0 0 12px rgba(0, 255, 136, 0.2); }
.matrix-admin-btn .btn-bracket { color: #00ff8844; transition: color 0.2s ease; }
.matrix-admin-btn:hover .btn-bracket { color: #00ff88; }

.scan-line { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #00ff8822, #00ff8866, #00ff8822, transparent); animation: scan 6s linear infinite; }
@keyframes scan { 0% { top: 0; opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }

.map-stats { position: absolute; bottom: 24px; right: 24px; display: flex; flex-direction: column; gap: 8px; }
.stat-item { display: flex; align-items: center; gap: 8px; font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 0.1em; color: #3a6a50; }
.stat-dot { width: 6px; height: 6px; border-radius: 50%; }
.stat-dot.online { background: #00ff88; box-shadow: 0 0 6px #00ff88; }
.stat-dot.offline { background: #ff4455; box-shadow: 0 0 6px #ff4455; }
.stat-label { color: #3a7a55; }

.map-title { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); font-family: 'Courier New', monospace; font-size: 13px; letter-spacing: 0.25em; color: #1a6640; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
.title-bracket { color: #00ff8844; }
.title-text { color: #00aa55; }
.title-blink { color: #00ff88; animation: blink 1.2s step-end infinite; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
</style>