<template>
  <div class="card">
    <div class="card-body">
      <div class="form-section">
        <h3 class="section-title">自动发现</h3>
        <div class="form-group mb-16">
          <label>自动发现密钥</label>
          <span class="help-text block-help mb-8">使用自动发现可以批量注册客户端，留空表示禁用自动发现。</span>
          <div class="input-with-btn">
            <input type="text" v-model="form.auto_discovery_token" placeholder="留空以禁用自动发现" class="form-control flex-1">
            <button class="btn btn-outline" @click="generateDiscoveryToken">生成</button>
            <button class="btn btn-secondary" @click="form.auto_discovery_token = ''" :disabled="!form.auto_discovery_token">清空</button>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3 class="section-title">历史数据</h3>
        <div class="form-group toggle-group mb-16">
          <div class="toggle-wrapper">
            <BaseToggle v-model="form.enable_history" />
            <span class="toggle-label">开启历史数据记录</span>
          </div>
          <span class="help-text block-help">关闭后将不再长期保留负载和Ping的历史监控数据。</span>
        </div>

        <div class="form-row" v-if="form.enable_history">
          <div class="form-group flex-1">
            <label>负载数据保留 (天)</label>
            <input type="number" v-model="form.load_retention_days" min="1" class="form-control">
          </div>
          <div class="form-group flex-1">
            <label>Ping数据保留 (天)</label>
            <input type="number" v-model="form.ping_retention_days" min="1" class="form-control">
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3 class="section-title">GeoIP 地理位置</h3>
        
        <div class="form-group toggle-group mb-16">
          <div class="toggle-wrapper">
            <BaseToggle v-model="form.geoip_enabled" />
            <span class="toggle-label">启用地理位置解析</span>
          </div>
          <span class="help-text block-help">启用后系统将解析并显示节点的地理位置信息。</span>
        </div>

        <div v-if="form.geoip_enabled">
          <div class="form-row">
            <div class="form-group flex-1">
              <label>地理位置数据提供商</label>
              <select v-model="form.geoip_provider" class="form-control">
                <option value="ip-api">在线 API (ip-api.com)</option>
                <option value="maxmind">本地数据库 (MaxMind GeoLite2)</option>
              </select>
            </div>
            <div class="form-group flex-2" v-if="form.geoip_provider === 'maxmind'">
              <label>MaxMind License Key</label>
              <div class="input-with-btn">
                <input type="text" v-model="form.geoip_license_key" placeholder="输入 MaxMind 许可证密钥" class="form-control">
                <button class="btn btn-outline" @click="updateGeoIPDB" :disabled="isUpdatingDB">
                  {{ isUpdatingDB ? '更新中...' : '更新数据库' }}
                </button>
              </div>
            </div>
          </div>

          <div class="form-group mb-0 mt-16">
            <label>测试 GeoIP 解析</label>
            <div class="input-with-btn">
              <input type="text" v-model="testIp" placeholder="输入 IP 地址进行测试" class="form-control">
              <button class="btn btn-secondary" @click="testGeoIP" :disabled="isTesting">
                测试解析
              </button>
            </div>
            <div v-if="testResult" class="test-result-tag">
              解析结果：<strong>{{ testResult }}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="action-row">
        <BaseSaveButton 
          :loading="isSubmitting" 
          text="保存通用设置" 
          @click="save" 
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import BaseToggle from '@/components/common/BaseToggle.vue'
import BaseSaveButton from '@/components/common/BaseSaveButton.vue'
import request from '@/utils/request.js'
import { showToast } from '@/utils/toast.js'

const props = defineProps({
  initialData: Object
})
const emit = defineEmits(['save'])

const form = ref({
  enable_history: true,
  load_retention_days: 7,
  ping_retention_days: 7,
  geoip_enabled: true,
  geoip_provider: 'ip-api',
  geoip_license_key: '',
  auto_discovery_token: ''
})

const isSubmitting = ref(false)
const isUpdatingDB = ref(false)
const isTesting = ref(false)
const testIp = ref('')
const testResult = ref('')

watch(() => props.initialData, (newVal) => {
  if (newVal) {
    form.value = {
      enable_history: newVal.enable_history === 'true' || newVal.enable_history === true,
      load_retention_days: Number(newVal.load_retention_days) || 7,
      ping_retention_days: Number(newVal.ping_retention_days) || 7,
      geoip_enabled: newVal.geoip_enabled === 'true' || newVal.geoip_enabled === true,
      geoip_provider: newVal.geoip_provider || 'ip-api',
      geoip_license_key: newVal.geoip_license_key || '',
      auto_discovery_token: newVal.auto_discovery_token || ''
    }
  }
}, { immediate: true })

const generateDiscoveryToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  form.value.auto_discovery_token = token
}

const save = async () => {
  isSubmitting.value = true
  await emit('save', form.value)
  isSubmitting.value = false
}

const updateGeoIPDB = async () => {
  if (!form.value.geoip_license_key) {
    showToast('请先输入 MaxMind License Key', 'error')
    return
  }
  isUpdatingDB.value = true
  try {
    await request.post('/api/admin/settings/geoip/update', { 
      license_key: form.value.geoip_license_key 
    })
    showToast('GeoIP 数据库更新成功', 'success')
  } catch (e) {
    showToast('更新失败: ' + (e.response?.data || e.message), 'error')
  } finally {
    isUpdatingDB.value = false
  }
}

const testGeoIP = async () => {
  if (!testIp.value) return
  isTesting.value = true
  testResult.value = ''
  try {
    const res = await request.post('/api/admin/settings/geoip/test', {
      ip: testIp.value,
      provider: form.value.geoip_provider
    })
    testResult.value = res.data.country_code || '解析失败'
  } catch (e) {
    showToast('测试失败: ' + (e.response?.data || e.message), 'error')
  } finally {
    isTesting.value = false
  }
}
</script>

<style scoped>
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }
.mb-16 { margin-bottom: 16px; }
.mb-8 { margin-bottom: 8px; }
.mt-16 { margin-top: 16px; }
.mb-0 { margin-bottom: 0; }

.border-top {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.toggle-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}
.toggle-label {
  font-size: 14px;
  color: var(--text-main);
  font-weight: 500;
}
.block-help {
  display: block;
  margin-top: 0;
}

.input-with-btn {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn {
  padding: 0 16px;
  height: 38px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  transition: all 0.2s;
}

.btn-outline {
  border: 1px solid var(--primary-color);
  background: transparent;
  color: var(--primary-color);
}

.btn-secondary {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-main);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.test-result-tag {
  margin-top: 10px;
  padding: 8px 12px;
  background: var(--bg-hover);
  border-radius: 4px;
  font-size: 13px;
  display: inline-block;
}

.action-row {
  margin-top: 32px;
  display: flex;
  justify-content: flex-end;
}
</style>