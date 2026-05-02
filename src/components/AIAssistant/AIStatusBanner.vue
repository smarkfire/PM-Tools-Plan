<template>
  <div class="ai-status-banner">
    <el-alert
      v-if="!aiAvailable"
      :title="t('ai.status.notConfigured')"
      type="warning"
      :closable="false"
      show-icon
    >
      <template #default>
        <p>{{ t('ai.status.notConfiguredDesc') }}</p>
        <div class="env-code">
          <code>DEEPSEEK_API_KEY=sk-xxx</code><br>
          <code>QWEN_API_KEY=sk-xxx</code>
        </div>
        <p class="mt-2">
          {{ t('ai.status.configHint') }}
          <el-button type="primary" link @click="openDoc">
            {{ t('ai.status.viewDoc') }}
          </el-button>
        </p>
      </template>
    </el-alert>
    <el-alert
      v-else
      :title="t('ai.status.available')"
      type="success"
      :closable="false"
      show-icon
    >
      <template #default>
        <p>{{ t('ai.status.availableDesc') }}</p>
        <div class="provider-list">
          <span
            v-for="p in configuredProviders"
            :key="p.name"
            class="provider-tag"
          >
            <el-tag size="small" type="success">
              {{ p.name }} {{ t('ai.status.configured') }}
            </el-tag>
          </span>
        </div>
      </template>
    </el-alert>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { aiAvailable, providers } = useAIAvailability()

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

.env-code {
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
