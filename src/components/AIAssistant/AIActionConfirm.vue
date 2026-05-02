<template>
  <el-dialog
    v-model="visible"
    title="操作确认"
    width="460px"
    :close-on-click-modal="false"
    class="action-confirm-dialog"
  >
    <div v-if="action" class="confirm-content">
      <div class="confirm-icon">
        <el-icon :size="32" color="#e6a23c"><WarningFilled /></el-icon>
      </div>
      <p class="confirm-text">{{ t('ai.action.confirmText') }}</p>
      <div class="action-detail">
        <div class="detail-row">
          <span class="detail-label">{{ t('ai.action.type') }}</span>
          <el-tag size="small" :type="actionTypeTag">{{ actionTypeLabel }}</el-tag>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ t('ai.action.description') }}</span>
          <span class="detail-value">{{ action.description }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleCancel">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="executing" @click="handleConfirm">
        {{ t('ai.action.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { WarningFilled } from '@element-plus/icons-vue'

interface ParsedAction {
  type: string
  entityId: string
  params: Record<string, any>
  description: string
}

const props = defineProps<{
  action: ParsedAction | null
  projectData: any
  tasks: any[]
}>()

const emit = defineEmits<{
  confirmed: [result: any]
  cancelled: []
}>()

const { t } = useI18n()
const visible = ref(false)
const executing = ref(false)

const actionTypeLabel = computed(() => {
  if (!props.action) return ''
  const map: Record<string, string> = {
    assign_task: t('ai.action.typeAssign'),
    update_duration: t('ai.action.typeDuration'),
    update_status: t('ai.action.typeStatus'),
    add_note: t('ai.action.typeNote'),
    set_priority: t('ai.action.typePriority')
  }
  return map[props.action.type] || props.action.type
})

const actionTypeTag = computed(() => {
  if (!props.action) return 'info'
  const map: Record<string, string> = {
    assign_task: 'primary',
    update_duration: 'warning',
    update_status: 'success',
    add_note: 'info',
    set_priority: 'danger'
  }
  return map[props.action.type] || 'info'
})

const show = () => {
  visible.value = true
}

const handleCancel = () => {
  visible.value = false
  emit('cancelled')
}

const handleConfirm = async () => {
  if (!props.action) return

  executing.value = true
  try {
    const result = await $fetch('/api/ai/confirm-action', {
      method: 'POST',
      body: {
        action: props.action,
        projectData: props.projectData,
        tasks: props.tasks
      }
    })

    visible.value = false
    emit('confirmed', result)
  } catch (error: any) {
    ElMessage.error(error.message || t('ai.action.executeFailed'))
  } finally {
    executing.value = false
  }
}

defineExpose({ show })
</script>

<style scoped>
.confirm-content {
  text-align: center;
}

.confirm-icon {
  margin-bottom: 12px;
}

.confirm-text {
  font-size: 15px;
  color: var(--el-text-color-primary);
  margin-bottom: 16px;
}

.action-detail {
  background: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 12px 16px;
  text-align: left;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
}

.detail-row + .detail-row {
  border-top: 1px solid var(--el-border-color-lighter);
}

.detail-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  min-width: 60px;
}

.detail-value {
  font-size: 13px;
  color: var(--el-text-color-primary);
}
</style>
