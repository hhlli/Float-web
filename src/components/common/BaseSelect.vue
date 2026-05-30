<template>
  <div class="base-select" ref="rootRef">
    <button class="select-trigger" @click="open = !open">
      <slot name="icon"/>
      <span>{{ currentLabel }}</span>
      <svg class="chevron" :class="{ open }" width="13" height="13" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>

    <transition name="dropdown">
      <div v-if="open" class="select-dropdown">
        <button
          v-for="opt in options"
          :key="opt.value"
          :class="['select-option', { active: modelValue === opt.value }]"
          @click="select(opt.value)"
        >
          <div class="option-main">
            <span class="option-label">{{ opt.label }}</span>
            <svg v-if="modelValue === opt.value" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2.5" class="check">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <span v-if="opt.desc" class="option-desc">{{ opt.desc }}</span>
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onClickOutside } from '@vueuse/core'

const props = defineProps({
  modelValue: { type: String, required: true },
  options: {
    type: Array,
    required: true,
  },
  placeholder: { type: String, default: '请选择' },
})

const emit = defineEmits(['update:modelValue'])

const open    = ref(false)
const rootRef = ref(null)

onClickOutside(rootRef, () => { open.value = false })

const currentLabel = computed(() =>
  props.options.find(o => o.value === props.modelValue)?.label || props.placeholder
)

const select = (val) => {
  emit('update:modelValue', val)
  open.value = false
}
</script>

<style scoped>
.base-select { position: relative; display: inline-block; }

.select-trigger {
  display: flex; align-items: center; gap: 7px;
  padding: 6px 12px; border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--surface-color);
  font-size: 13px; font-weight: 500;
  color: var(--text-main);
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s;
}
.select-trigger:hover { border-color: var(--primary-color); }

.chevron { color: var(--text-muted); transition: transform 0.2s; flex-shrink: 0; }
.chevron.open { transform: rotate(180deg); }

.select-dropdown {
  position: absolute; right: 0; top: calc(100% + 6px); z-index: 200;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  min-width: 200px;
  max-height: 320px;
  overflow-y: auto;
  padding: 4px;
}

.select-option {
  width: 100%; display: flex; flex-direction: column; gap: 2px;
  padding: 9px 12px; border-radius: 7px; border: none;
  background: transparent; text-align: left; cursor: pointer;
  transition: background 0.12s;
}
.select-option:hover  { background: var(--bg-color); }
.select-option.active { background: rgba(59,130,246,0.07); }

.option-main  { display: flex; justify-content: space-between; align-items: center; }
.option-label { font-size: 13px; font-weight: 500; color: var(--text-main); }
.option-desc  { font-size: 12px; color: var(--text-muted); }
.check        { color: var(--primary-color); flex-shrink: 0; }

.dropdown-enter-active, .dropdown-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px); }
</style>