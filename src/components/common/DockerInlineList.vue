<template>
  <div v-if="parsedContainers.length > 0" class="docker-inline-wrapper">
    <div class="docker-tags">
      <div 
        v-for="container in parsedContainers" 
        :key="container.id" 
        class="docker-tag"
      >
        <span class="c-name">{{ container.name }}</span>
        <span :class="['state-pill', container.state]">{{ container.state }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  dockerData: {
    type: [String, Array],
    default: () => []
  }
})

const parsedContainers = computed(() => {
  const raw = props.dockerData
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  }
  return raw || []
})
</script>

<style scoped>
.docker-inline-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-top: 8px;
  padding: 0 4px;
}


.docker-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
}

.docker-tag {
  display: flex;
  align-items: center;
  gap: 6px;
}

.c-name {
  font-size: 13px;
  color: var(--text-main);
  font-weight: 500;
}

.state-pill {
  font-size: 9px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.state-pill.running { background-color: rgba(16, 185, 129, 0.15); color: #10b981; }
.state-pill.exited, .state-pill.dead { background-color: rgba(107, 114, 128, 0.15); color: #6b7280; }
.state-pill.paused { background-color: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.state-pill.restarting, .state-pill.created { background-color: rgba(59, 130, 246, 0.15); color: #3b82f6; }
</style>