<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-card">
          <div class="card-header">{{ title }}</div>
          
          <div class="card-body">
            <slot></slot> 
          </div>
          
          <div class="modal-footer">
            <slot name="footer">
              <button class="btn-outline" @click="$emit('close')">取消</button>
            </slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  show: Boolean,
  title: String
})
defineEmits(['close'])
</script>

<style scoped>
/* 遮罩层 */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

/* 🌟 核心修改 1：将 padding 提升到最外层卡片，确保四周间距绝对统一 (24px) */
.modal-card {
  background: var(--surface-color, #ffffff);
  border-radius: 12px;
  width: 460px;
  max-width: 90%;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 24px; /* 统一四周的间距 */
  box-sizing: border-box;
}

/* 🌟 核心修改 2：彻底去掉 header 的下划线和自带边距，模仿“编辑节点”的干净样式 */
.card-header {
  font-size: 18px; /* 字体加大，更像标题 */
  font-weight: 600;
  color: var(--text-main, #1e293b);
  margin-bottom: 20px; /* 标题与下方表单的间距 */
  line-height: 1.2;
}

/* 主体内容容器 */
.card-body {
  flex: 1;
  /* 此处无需 padding，外层 card 已经限制了边距 */
}

/* 🌟 核心修改 3：规范底部按钮区域的间距 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 24px; /* 强制与上方内容的间距 */
}

/* 🌟 核心修改 4：强行接管所有插入按钮的样式，确保宽高、边框完美一致 🌟 */
:deep(.btn-outline),
:deep(.btn-cancel),
:deep(.btn-primary),
:deep(.btn-danger-solid) {
  padding: 8px 20px; /* 稍微加宽了按钮，看起来更大气 */
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 灰色线框取消按钮 */
:deep(.btn-outline),
:deep(.btn-cancel) {
  background: #ffffff;
  color: #475569;
  border: 1px solid #cbd5e1 !important; /* 强制细边框 */
}
:deep(.btn-outline:hover),
:deep(.btn-cancel:hover) {
  background: #f8fafc;
  color: #0f172a;
  border-color: #94a3b8 !important;
}

/* 蓝色主按钮 */
:deep(.btn-primary) {
  background: #3b82f6;
  color: #ffffff;
  border: 1px solid #3b82f6 !important;
}
:deep(.btn-primary:hover) {
  background: #2563eb;
  border-color: #2563eb !important;
}

/* 红色危险按钮 */
:deep(.btn-danger-solid) {
  background: #ef4444;
  color: #ffffff;
  border: 1px solid #ef4444 !important;
}
:deep(.btn-danger-solid:hover) {
  background: #dc2626;
  border-color: #dc2626 !important;
}

/* 弹窗弹出动画 */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.25s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-active .modal-card, .modal-fade-leave-active .modal-card {
  transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.modal-fade-enter-from .modal-card, .modal-fade-leave-to .modal-card {
  transform: translateY(-20px) scale(0.95);
}
</style>