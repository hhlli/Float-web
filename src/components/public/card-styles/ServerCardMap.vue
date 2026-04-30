<template>
  <div class="map-container">
    <v-chart class="chart" :option="chartOption" autoresize />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { MapChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import * as echarts from 'echarts/core'

import worldJson from '../../../assets/world.json'

// 注册需要的组件
use([CanvasRenderer, MapChart, TitleComponent, TooltipComponent, VisualMapComponent])

echarts.registerMap('world', worldJson)

const props = defineProps({
  servers: {
    type: Array,
    required: true
  }
})

// ECharts world.json 国家名称映射
const isoToName = {
  'US': 'United States',
  'CN': 'China',
  'HK': 'China',
  'TW': 'Taiwan',
  'JP': 'Japan',
  'SG': 'Singapore',
  'GB': 'United Kingdom',
  'DE': 'Germany',
  'FR': 'France',
  'KR': 'South Korea',
  'CA': 'Canada',
  'AU': 'Australia',
  'NL': 'Netherlands',
  'RU': 'Russia',
  'IN': 'India'
}

// 数据预处理
const mapData = computed(() => {
  const countryStats = {}

  props.servers.forEach(s => {
    const code = s.region?.toUpperCase()
    if (!code || code === 'UN') return 

    const countryName = isoToName[code] || code

    if (!countryStats[countryName]) {
      countryStats[countryName] = { total: 0, online: 0 }
    }
    countryStats[countryName].total++
    if (s.status === 'online') {
      countryStats[countryName].online++
    }
  })

  return Object.keys(countryStats).map(name => {
    const stats = countryStats[name]
    
    // 状态值：0=全部离线, 1=部分在线, 2=全部在线
    let statusVal = 0
    if (stats.online === stats.total) statusVal = 2
    else if (stats.online > 0) statusVal = 1
    
    return {
      name: name,
      value: statusVal,
      stats: stats 
    }
  })
})

const chartOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'var(--border-color, #e2e8f0)',
    textStyle: { color: 'var(--text-main, #1e293b)' },
    formatter: function (params) {
      if (!params.data || !params.data.stats) return params.name;
      const stats = params.data.stats;
      return `
        <div style="font-weight:bold; margin-bottom:4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">${params.name}</div>
        <div style="font-size: 13px; line-height: 1.6;">
          节点总数: <b>${stats.total}</b><br/>
          🟢 在线: <span style="color:#10b981; font-weight:bold;">${stats.online}</span><br/>
          🔴 离线: <span style="color:#ef4444; font-weight:bold;">${stats.total - stats.online}</span>
        </div>
      `;
    }
  },
  visualMap: {
    type: 'piecewise',
    left: 24,
    bottom: 24,
    pieces: [
      { value: 2, label: '全部在线', color: '#10b981' }, 
      { value: 1, label: '部分在线', color: '#f59e0b' }, 
      { value: 0, label: '全部离线', color: '#ef4444' }  
    ],
    // 🌟 核心修改：去掉所有背景和边框设置，只保留文字样式
    textStyle: { color: 'var(--text-main, #334155)', fontSize: 13, fontWeight: 500 },
    itemSymbol: 'circle',
    itemWidth: 10,
    itemHeight: 10,
    itemGap: 12
  },
  series: [
    {
      type: 'map',
      map: 'world',
      roam: false, 
      zoom: 1.25,        // 🌟 核心修改：直接放大 1.25 倍
      top: '12%',        // 🌟 核心修改：压缩上下留白，使地图更丰满
      itemStyle: {
        areaColor: '#f1f5f9', 
        borderColor: '#ffffff', 
        borderWidth: 1
      },
      emphasis: {
        itemStyle: {
          areaColor: '#cbd5e1' 
        },
        label: { show: false }
      },
      data: mapData.value
    }
  ]
}))
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 400px; 
  background: var(--surface-color, #fff);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
  overflow: hidden;
  position: relative;
}

.chart {
  width: 100%;
  height: 100%;
}
</style>