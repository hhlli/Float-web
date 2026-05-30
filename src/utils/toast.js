import { reactive } from 'vue'

export const toastState = reactive({
  show: false,
  message: '',
  type: 'success' // 'success' 或 'error'
})

let timer = null

export const showToast = (message, type = 'success') => {
  if (timer) clearTimeout(timer)
  toastState.message = message
  toastState.type = type
  toastState.show = true
  
  timer = setTimeout(() => {
    toastState.show = false
  }, 2500)
}