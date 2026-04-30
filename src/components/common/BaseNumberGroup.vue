<template>
  <div class="form-group" :style="{ width: width, marginBottom: '0' }">
    <label style="display: block; font-size: 14px; font-weight: bold; margin-bottom: 12px; color: var(--text-main);">
      {{ label }}
    </label>
    <input 
      type="number" 
      :value="modelValue" 
      @input="onInput"
      :min="min" 
      :max="max" 
      :placeholder="placeholder" 
      style="height: 36px; padding: 0 12px; box-sizing: border-box; width: 100%;"
    >
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: [Number, String], default: '' },
  label: { type: String, required: true },
  width: { type: String, default: '150px' },
  min: { type: [Number, String], default: '' },
  max: { type: [Number, String], default: '' },
  placeholder: { type: [Number, String], default: '' }
})
const emit = defineEmits(['update:modelValue'])

const onInput = (e) => {
  const val = e.target.value
  emit('update:modelValue', val === '' ? '' : Number(val))
}
</script>

<style scoped>
.form-group input { border: 1px solid var(--border-color, #dcdfe6); border-radius: 6px; background: transparent; color: var(--text-main); outline: none; transition: border-color 0.2s; }
.form-group input:focus { border-color: var(--accent, #7c6af7); }
</style>