<template>
  <div class="card fluid-card">
    <div class="card-header">通知规则</div>
    <div class="card-body" style="padding: 0;">

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
.fluid-card { width: 100%; }

.inner-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color, #3a3a4a);
  padding: 0 24px;
}
.inner-tab {
  padding: 14px 16px;
  font-size: 14px;
  color: var(--text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.2s;
}
.inner-tab.active {
  color: var(--accent, #7c6af7);
  border-bottom-color: var(--accent, #7c6af7);
}
.inner-tab:hover { color: var(--text-main); }

.tab-content { padding: 24px; }
</style>