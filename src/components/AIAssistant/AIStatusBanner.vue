<template>
  <div class="ai-status-banner" v-if="!dismissed">
    <el-alert
      v-if="!aiAvailable"
      :title="t('ai.status.notConfigured')"
      type="warning"
      closable
      @close="dismissed = true"
      show-icon
    >
      <template #default>
        <span class="alert-block">{{ t('ai.status.notConfiguredDesc') }}</span>
        <span class="env-code">
          <code>DEEPSEEK_API_KEY=sk-xxx</code><br>
          <code>QWEN_API_KEY=sk-xxx</code>
        </span>
        <span class="alert-block mt-2">
          {{ t('ai.status.configHint') }}
          <el-button type="primary" link @click="openDoc">
            {{ t('ai.status.viewDoc') }}
          </el-button>
        </span>
      </template>
    </el-alert>
    <el-alert
      v-else
      :title="t('ai.status.available')"
      type="success"
      closable
      @close="dismissed = true"
      show-icon
    >
      <template #default>
        <span class="alert-block">{{ t('ai.status.availableDesc') }}</span>
        <span class="provider-list">
          <span
            v-for="p in configuredProviders"
            :key="p.name"
            class="provider-tag"
          >
            <el-tag size="small" type="success">
              {{ p.name }} {{ t('ai.status.configured') }}
            </el-tag>
          </span>
        </span>
      </template>
    </el-alert>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { aiAvailable, providers } = useAIAvailability()

const dismissed = ref(false)

onMounted(() => {
  const saved = localStorage.getItem('ai-status-banner-dismissed')
  if (saved === 'true') {
    dismissed.value = true
  }
})

watch(dismissed, (val) => {
  localStorage.setItem('ai-status-banner-dismissed', String(val))
})

const configuredProviders = computed(() =>
  providers.value.filter(p => p.configured)
)

const openDoc = () => {
  window.open('https://github.com/smarkfire/PM-Tools-Plan#ai-configuration', '_blank')
}
</script>

<style scoped>
.ai-status-banner {
  margin-bottom: 16px;
}

.alert-block {
  display: block;
}

.env-code {
  display: block;
  background: var(--el-fill-color-light);
  padding: 8px 12px;
  border-radius: 4px;
  margin: 8px 0;
  font-size: 13px;
  line-height: 1.8;
}

.provider-list {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.mt-2 {
  margin-top: 8px;
}
</style>
