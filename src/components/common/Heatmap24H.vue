<template>
  <div class="uptime-24h-wrapper">
    <div class="header-info">
      <span class="label">24h</span>
      <span class="sla-text" :class="slaColorClass"> {{ sla }}%</span>
    </div>
    
    <div class="heatmap-track">
      <div
        v-for="(item, index) in history"
        :key="index"
        class="heatmap-block"
        :class="item.status"
        :title="`时间: ${item.hour}:00 | 状态: ${formatStatus(item.status)}`"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  history: {
    type: Array,
    required: true,
    default: () => []
  },
  sla: {
    type: [String, Number],
    required: true,
    default: '0.00'
  }
});

// 状态文本转换
const formatStatus = (status) => {
  const statusMap = {
    'online': '在线',
    'warning': '网络波动', // 补充黄色状态映射
    'offline': '离线',
    'nodata': '无数据'
  };
  return statusMap[status] || status;
};

// 根据 SLA 动态设置文本颜色
const slaColorClass = computed(() => {
  const slaValue = parseFloat(props.sla);
  if (slaValue >= 99) return 'text-excellent';
  if (slaValue >= 90) return 'text-warning';
  return 'text-danger';
});
</script>

<style scoped>
.uptime-24h-wrapper {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
  margin-top: 8px;
}

.header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
}

.sla-text {
  font-weight: 600;
}

/* 轨道与分块布局 */
.heatmap-track {
  display: flex;
  gap: 3px; /* 块与块之间的间距 */
  height: 12px; /* 降低块的高度 */
  width: 100%;
}

.heatmap-block {
  flex: 1;
  height: 100%;
  border-radius: 3px;
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.1s ease;
}

.heatmap-block:hover {
  opacity: 0.8;
  transform: scale(1.05);
}

/* 颜色定义 */
.heatmap-block.online {
  background-color: #10b981; /* 绿色 */
}

.heatmap-block.warning {
  background-color: #f59e0b; /* 黄色/橙色 */
}

.heatmap-block.offline {
  background-color: #ef4444; /* 红色 */
}

.heatmap-block.nodata {
  background-color: #d1d5db; /* 灰色 */
}

/* SLA 文本颜色 */
.text-excellent { color: #10b981; }
.text-warning { color: #f59e0b; }
.text-danger { color: #ef4444; }
</style>