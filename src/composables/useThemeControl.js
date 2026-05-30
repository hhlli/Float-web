import { ref } from 'vue'

const themes = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1', '#14b8a6']

// 1. 初始化读取
const savedIndex = parseInt(localStorage.getItem('float_color_index') || '0', 10)
const currentThemeIndex = ref(savedIndex)

// 2. 提取出最核心的写入动作（不依赖 Vue 响应式，纯 JS 操作）
const applyColorToDOM = (idx) => {
  // 注入到 html 节点
  document.documentElement.style.setProperty('--primary-color', themes[idx])
  
  // 🌟 保险起见：如果你的 CSS 变量是定义在 body 或者 #app 上，取消下面两行的注释：
  // document.body.style.setProperty('--primary-color', themes[idx])
  // document.getElementById('app')?.style.setProperty('--primary-color', themes[idx])
  
  // 写入缓存
  localStorage.setItem('float_color_index', idx.toString())
}

// 3. 文件被 import 时，立刻无条件执行一次，完成初始化
applyColorToDOM(currentThemeIndex.value)

const isDark = ref(localStorage.getItem('float_dark_mode') === 'true' || document.documentElement.classList.contains('dark'))

export const useThemeControl = () => {
  const toggleDarkMode = () => {
    isDark.value = !isDark.value
    document.documentElement.classList.toggle('dark', isDark.value)
    localStorage.setItem('float_dark_mode', isDark.value.toString()) 
  }

  const toggleThemeColor = () => {
    // 4. 手动调用并触发，100% 绝对执行
    currentThemeIndex.value = (currentThemeIndex.value + 1) % themes.length
    applyColorToDOM(currentThemeIndex.value)
  }

  return { isDark, toggleDarkMode, toggleThemeColor, currentThemeIndex, themes }
}