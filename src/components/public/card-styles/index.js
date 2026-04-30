// src/components/public/card-styles/index.js
import { defineAsyncComponent } from 'vue'

export const cardStyles = [
  {
    value: 'default',
    label: '详细列表',
    desc: '完整信息展示，含进度条',
    component: defineAsyncComponent(() => import('./ServerCardDefault.vue')),
  },
  {
    value: 'dashboard',
    label: '仪表盘',
    desc: '环形图表，紧凑风格',
    component: defineAsyncComponent(() => import('./ServerCardDashboard.vue')),
  },
  // 将来在这里继续追加，PublicView 不需要改动
  {
    value: 'map',
    label: '世界地图',
    desc: '地理位置点亮视图',
    isGlobal: true, // 🌟 核心标记：这是一个全局视图组件
    component: defineAsyncComponent(() => import('./ServerCardMap.vue')),
  }
]

export const defaultStyle = 'default'