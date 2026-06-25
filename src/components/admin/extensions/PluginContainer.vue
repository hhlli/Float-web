<template>
  <div class="plugin-container">
    <component 
      :is="currentComponent" 
      :ext-id="extId" 
    />
  </div>
</template>

<script setup>
import { shallowRef, watch, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'

// 静态导入通用兜底组件
import GenericWorkspace from './GenericWorkspace.vue'

const route = useRoute()
const extId = route.query.ext_id

// 专属组件注册表 (懒加载)
const pluginRegistry = {
  'mtr-plugin': defineAsyncComponent(() => import('./MTRWorkspace.vue')),
  // 未来新增的专属页面往这里加，例如：
  // 'speedtest-plugin': defineAsyncComponent(() => import('./SpeedtestWorkspace.vue')),
}

const currentComponent = shallowRef(GenericWorkspace)

watch(() => route.query.ext_id, (newExtId) => {
  if (!newExtId) return
  if (pluginRegistry[newExtId]) {
    currentComponent.value = pluginRegistry[newExtId]
  } else {
    currentComponent.value = GenericWorkspace
  }
}, { immediate: true })
</script>

<style scoped>
.plugin-container {
  width: 100%;
  height: 100%;
}
</style>