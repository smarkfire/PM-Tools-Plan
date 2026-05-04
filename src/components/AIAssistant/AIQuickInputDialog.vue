<template>
  <el-dialog
    v-model="visible"
    :title="t('ai.quickInput.title')"
    width="560px"
    :close-on-click-modal="false"
    destroy-on-close
    class="quick-input-dialog"
  >
    <div class="quick-input-body">
      <p class="input-hint">{{ t('ai.quickInput.hint') }}</p>
      <el-input
        v-model="inputText"
        type="textarea"
        :rows="6"
        :placeholder="t('ai.quickInput.placeholder')"
        :disabled="parsing"
        resize="vertical"
        class="input-area"
      />
      <div class="input-tips">
        <i class="fa fa-lightbulb"></i>
        <span>{{ t('ai.quickInput.tips') }}</span>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleCancel">{{ t('common.buttons.cancel') }}</el-button>
      <el-button type="primary" :loading="parsing" :disabled="!inputText.trim()" @click="handleParse">
        <i v-if="!parsing" class="fa fa-magic" style="margin-right: 4px"></i>
        {{ parsing ? t('ai.quickInput.parsing') : t('ai.quickInput.parseBtn') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/store/auth'

const { t, locale } = useI18n()
const authStore = useAuthStore()

const visible = ref(false)
const inputText = ref('')
const parsing = ref(false)

const emit = defineEmits<{
  parsed: [data: {
    projectName: string
    startDate: string
    endDate: string
    description: string
    industry: string
    teamMembers: Array<{ name: string; role: string; email: string }>
    requirements: string
  }]
}>()

const show = () => {
  visible.value = true
  inputText.value = ''
  parsing.value = false
}

const handleCancel = () => {
  visible.value = false
}

const handleParse = async () => {
  if (!inputText.value.trim()) return

  parsing.value = true
  try {
    const result = await $fetch<any>('/api/ai/parse-project', {
      method: 'POST',
      headers: authStore.getAuthHeaders(),
      body: { input: inputText.value, locale: locale.value }
    })

    visible.value = false
    emit('parsed', result)
    ElMessage.success(t('ai.quickInput.parseSuccess'))
  } catch (error: any) {
    const msg = error?.data?.statusMessage || error?.data?.message || error?.message || t('ai.quickInput.parseFailed')
    ElMessage.error(msg)
  } finally {
    parsing.value = false
  }
}

defineExpose({ show })
</script>

<style scoped>
.quick-input-body {
  padding: 0 4px;
}

.input-hint {
  font-size: 14px;
  color: var(--el-text-color-regular);
  margin: 0 0 12px;
  line-height: 1.6;
}

.input-area :deep(.el-textarea__inner) {
  font-size: 14px;
  line-height: 1.8;
}

.input-tips {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.input-tips i {
  color: #e6a23c;
  margin-top: 2px;
  flex-shrink: 0;
}
</style>
