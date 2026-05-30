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
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-card {
  background: var(--surface-color);
  border-radius: 12px;
  width: 460px;
  max-width: 90%;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 24px;
  box-sizing: border-box;
}

.card-header {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 20px;
  line-height: 1.2;
}

.card-body {
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.25s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-active .modal-card, .modal-fade-leave-active .modal-card {
  transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.modal-fade-enter-from .modal-card, .modal-fade-leave-to .modal-card {
  transform: translateY(-20px) scale(0.95);
}
</style>