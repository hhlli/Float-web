<template>
  <div class="card">
    <div class="card-body" style="overflow-x: auto;">
      
      <h3 class="section-title">通知规则</h3>
      
      <div style="min-width: max-content; padding-bottom: 8px;">
        <div class="inner-tabs">
          <div
            v-for="tab in tabs"
            :key="tab.key"
            :class="['inner-tab', { active: activeTab === tab.key }]"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </div>
        </div>

        <div class="tab-content">
          <OfflineRule v-if="activeTab === 'offline'" />
          <LoadRule v-if="activeTab === 'load'" />
          <TrafficRule v-if="activeTab === 'traffic'" />
          <ExpiryRule v-if="activeTab === 'expiry'" />
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import OfflineRule from './rules/OfflineRule.vue'
import LoadRule from './rules/LoadRule.vue'
import TrafficRule from './rules/TrafficRule.vue'
import ExpiryRule from './rules/ExpiryRule.vue'

const activeTab = ref('offline')

const tabs = [
  { key: 'offline', label: '离线通知' },
  { key: 'load', label: '负载通知' },
  { key: 'traffic', label: '流量通知' },
  { key: 'expiry', label: '过期提醒' }
]
</script>

<style scoped>
.inner-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  /* 去除了原先的 padding: 0 20px; 以便与标题保持左对齐 */
}

.inner-tab {
  padding: 14px 16px;
  font-size: 14px;
  color: var(--text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.2s, border-bottom-color 0.2s;
}
/* 第一个 tab 取消左侧 padding，让文字绝对左对齐 */
.inner-tab:first-child {
  padding-left: 0;
}

.inner-tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.inner-tab:hover {
  color: var(--text-main);
}

.tab-content {
  padding: 20px 0 0;
}
</style>