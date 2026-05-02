<template>
  <div class="chat-input">
    <el-input
      ref="inputRef"
      v-model="inputText"
      type="textarea"
      :rows="2"
      :placeholder="t('ai.chat.inputPlaceholder')"
      resize="none"
      @keydown.enter.exact.prevent="handleSend"
    />
    <el-button
      type="primary"
      :icon="Promotion"
      :loading="loading"
      :disabled="!inputText.trim()"
      @click="handleSend"
    >
      {{ t('ai.chat.send') }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { Promotion } from '@element-plus/icons-vue'

const props = defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  send: [text: string]
}>()

const { t } = useI18n()
const inputText = ref('')
const inputRef = ref()

const handleSend = () => {
  const text = inputText.value.trim()
  if (!text || props.loading) return
  emit('send', text)
  inputText.value = ''
  nextTick(() => {
    inputRef.value?.focus()
  })
}

defineExpose({
  focus: () => inputRef.value?.focus()
})
</script>

<style scoped>
.chat-input {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.chat-input :deep(.el-textarea__inner) {
  font-size: 14px;
}

.chat-input .el-button {
  align-self: flex-end;
}
</style>
