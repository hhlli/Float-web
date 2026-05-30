<template>
  <div class="map-container">
    <v-chart class="chart" :option="chartOption" autoresize />
    
    <div class="zoom-controls">
      <button class="z-btn" @click="zoomIn" title="放大">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <button class="z-btn" @click="zoomOut" title="缩小">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <button class="z-btn" @click="resetZoom" title="重置视角">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { MapChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import * as echarts from 'echarts/core'

import worldJson from '@/assets/world.json'

use([CanvasRenderer, MapChart, TitleComponent, TooltipComponent, VisualMapComponent])
echarts.registerMap('world', worldJson)

const props = defineProps({
  servers: { type: Array, required: true }
})
// 👇 新增：统计全局的在线与离线设备总数
const globalStats = computed(() => {
  let online = 0
  let offline = 0
  props.servers.forEach(s => {
    if (s.status === 'online') online++
    else offline++
  })
  return { online, offline }
})
// === 🌟 核心修复：使用 ref 使缩放比例具备响应式 ===
const currentZoom = ref(1.5) // 初始缩放略微调大，减少初始留白

const zoomIn = () => {
  if (currentZoom.value < 5) currentZoom.value += 0.3
}

const zoomOut = () => {
  if (currentZoom.value > 1) currentZoom.value -= 0.3
}

const resetZoom = () => {
  currentZoom.value = 1.5
}

// 监听夜间模式
const isDarkMode = ref(false)
let observer = null

onMounted(() => {
  isDarkMode.value = document.documentElement.classList.contains('dark')
  observer = new MutationObserver(() => {
    isDarkMode.value = document.documentElement.classList.contains('dark')
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})

const isoToName = {
  'US': 'United States', 'CN': 'China', 'HK': 'China', 'TW': 'Taiwan', 'JP': 'Japan',
  'SG': 'Singapore', 'GB': 'United Kingdom', 'DE': 'Germany', 'FR': 'France',
  'KR': 'South Korea', 'CA': 'Canada', 'AU': 'Australia', 'NL': 'Netherlands',
  'RU': 'Russia', 'IN': 'India',
  'BR': 'Brazil', 'IE': 'Ireland', 'IT': 'Italy', 'ES': 'Spain', 
  'SE': 'Sweden', 'CH': 'Switzerland', 'ZA': 'South Africa',
  'AE': 'United Arab Emirates', 'MX': 'Mexico', 'TR': 'Turkey',
  'PL': 'Poland', 'ID': 'Indonesia', 'MY': 'Malaysia', 'PH': 'Philippines',
  'VN': 'Vietnam', 'TH': 'Thailand', 'AR': 'Argentina', 'CL': 'Chile',
  'FI': 'Finland', 'NO': 'Norway', 'DK': 'Denmark', 'AT': 'Austria',
  'BE': 'Belgium', 'RO': 'Romania', 'BG': 'Bulgaria', 'CZ': 'Czech Rep.',
  'PT': 'Portugal', 'GR': 'Greece', 'IL': 'Israel', 'SA': 'Saudi Arabia',
  'NZ': 'New Zealand', 'NG': 'Nigeria', 'KE': 'Kenya'
}

const mapData = computed(() => {
  const countryStats = {}
  props.servers.forEach(s => {
    const code = s.region?.toUpperCase()
    if (!code || code === 'UN') return 
    const countryName = isoToName[code] || code
    if (!countryStats[countryName]) countryStats[countryName] = { total: 0, online: 0 }
    countryStats[countryName].total++
    if (s.status === 'online') countryStats[countryName].online++
  })
  return Object.keys(countryStats).map(name => {
    const stats = countryStats[name]
    // 👇 修改点：只要有在线节点即算作 1（在线），全部离线则为 0（离线）
    const statusVal = stats.online > 0 ? 1 : 0
    return { name: name, value: statusVal, stats: stats }
  })
})

const chartOption = computed(() => {
  const isDark = isDarkMode.value
  
  const tooltipBg = isDark ? '#1e293b' : 'rgba(255, 255, 255, 0.95)'
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0'
  const textColor = isDark ? '#f8fafc' : '#1e293b'
  const dividerColor = isDark ? '#334155' : '#e2e8f0'
  const mapAreaColor = isDark ? '#334155' : '#f1f5f9'
  const mapBorderColor = isDark ? '#0f172a' : '#ffffff'
  const mapHoverColor = isDark ? '#475569' : '#e2e8f0'

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      textStyle: { color: textColor },
      formatter: function (params) {
        if (!params.data || !params.data.stats) return params.name;
        const stats = params.data.stats;
        return `
          <div style="font-weight:bold; margin-bottom:6px; border-bottom: 1px solid ${dividerColor}; padding-bottom: 6px;">${params.name}</div>
          <div style="font-size: 13px; line-height: 1.8;">
            节点总数: <b>${stats.total}</b><br/>
            🟢 在线: <span style="color:#10b981; font-weight:bold;">${stats.online}</span><br/>
            🔴 离线: <span style="color:#ef4444; font-weight:bold;">${stats.total - stats.online}</span>
          </div>
        `;
      }
    },
    visualMap: {
      type: 'piecewise',
      left: 16,
      bottom: 24, 
      pieces: [
        // 👇 修改点：绑定动态数量，移除“部分在线”分类
        { value: 1, label: `在线 ${globalStats.value.online} 台`, color: '#10b981' }, 
        { value: 0, label: `离线 ${globalStats.value.offline} 台`, color: '#ef4444' }  
      ],
      textStyle: { color: textColor, fontSize: 13, fontWeight: 600 }, // 提升了字号和字重使其更清晰
      itemSymbol: 'circle',
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 12
    },
    series: [
      {
        type: 'map',
        map: 'world',
        roam: 'move', // 禁用滚轮，保留拖拽
        // 🌟 核心修复：使用响应式的 zoom 值
        zoom: currentZoom.value,
        // 🌟 核心改进：使用 layoutCenter 和 layoutSize 强制地图充满容器
        layoutCenter: ['50%', '50%'], 
        layoutSize: '170%', 
        selectedMode: false, 
        itemStyle: { 
          areaColor: mapAreaColor, 
          borderColor: mapBorderColor, 
          borderWidth: 1 
        },
        emphasis: { 
          itemStyle: { areaColor: mapHoverColor }, 
          label: { show: false } 
        },
        data: mapData.value
      }
    ]
  }
})
</script>

<style scoped>
.map-container {
  width: 100%;
  /* 动态高度，100vh 减去非地图区域的高度 */
  height: calc(100vh - 240px); 
  min-height: 500px;
  background: var(--surface-color);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
  overflow: hidden;
  position: relative;
  border: 1px solid var(--border-color); 
}

.chart { 
  width: 100%; 
  height: 100%; 
}

/* 控制台按钮样式 */
.zoom-controls {
  position: absolute;
  right: 16px;
  bottom: 16px;
  display: flex;
  flex-direction: column;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  overflow: hidden;
  z-index: 10;
}

.z-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-main);
  cursor: pointer;
  transition: background 0.2s;
}

.z-btn:last-child {
  border-bottom: none;
}

.z-btn:hover {
  background: rgba(128, 128, 128, 0.1);
}

.z-btn svg {
  width: 16px;
  height: 16px;
}
</style>