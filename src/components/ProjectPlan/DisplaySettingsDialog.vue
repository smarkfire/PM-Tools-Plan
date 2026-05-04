<template>
  <el-dialog
    :model-value="visible"
    :title="$t('tasks.settings.display.title')"
    width="500px"
    @close="handleClose"
  >
    <div class="display-settings">
      <el-form :label-width="$t('tasks.settings.display.labelWidth') || '120px'">
        <el-form-item :label="$t('tasks.settings.display.columns.showWBS')">
          <el-switch v-model="localSettings.showWBS" />
        </el-form-item>
        <el-form-item :label="$t('tasks.settings.display.columns.showName')">
          <el-switch v-model="localSettings.showName" />
        </el-form-item>
        <el-form-item :label="$t('tasks.settings.display.columns.showStartDate')">
          <el-switch v-model="localSettings.showStartDate" />
        </el-form-item>
        <el-form-item :label="$t('tasks.settings.display.columns.showEndDate')">
          <el-switch v-model="localSettings.showEndDate" />
        </el-form-item>
        <el-form-item :label="$t('tasks.settings.display.columns.showDuration')">
          <el-switch v-model="localSettings.showDuration" />
        </el-form-item>
        <el-form-item :label="$t('tasks.settings.display.columns.showDeliverable')">
          <el-switch v-model="localSettings.showDeliverable" />
        </el-form-item>
        <el-form-item :label="$t('tasks.settings.display.columns.showDependencies')">
          <el-switch v-model="localSettings.showDependencies" />
        </el-form-item>
        <el-form-item :label="$t('tasks.settings.display.columns.showAssignee')">
          <el-switch v-model="localSettings.showAssignee" />
        </el-form-item>
        <el-form-item :label="$t('tasks.settings.display.columns.showPriority')">
          <el-switch v-model="localSettings.showPriority" />
        </el-form-item>
        <el-form-item :label="$t('tasks.settings.display.columns.showStatus')">
          <el-switch v-model="localSettings.showStatus" />
        </el-form-item>
        <el-form-item :label="$t('tasks.settings.display.columns.showMilestone')">
          <el-switch v-model="localSettings.showMilestone" />
        </el-form-item>
        <el-form-item :label="$t('tasks.settings.display.columns.showDescription')">
          <el-switch v-model="localSettings.showDescription" />
        </el-form-item>
      </el-form>

      <div class="mt-6 pt-4 border-t">
        <div class="text-sm font-bold mb-3">{{ $t('tasks.settings.display.quickActions') }}</div>
        <div class="flex gap-2">
          <el-button size="small" @click="selectAll">{{ $t('tasks.settings.display.selectAll') }}</el-button>
          <el-button size="small" @click="selectNone">{{ $t('tasks.settings.display.selectNone') }}</el-button>
          <el-button size="small" @click="resetToDefault">{{ $t('tasks.settings.display.resetToDefault') }}</el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">{{ $t('common.buttons.cancel') }}</el-button>
      <el-button type="primary" @click="handleSave">
        {{ $t('common.buttons.save') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  settings: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:visible', 'save'])

const localSettings = reactive({
  showWBS: true,
  showName: true,
  showStartDate: true,
  showEndDate: true,
  showDuration: true,
  showDeliverable: true,
  showDependencies: false,
  showAssignee: true,
  showPriority: true,
  showStatus: true,
  showMilestone: true,
  showDescription: false
})

const defaultSettings = {
  showWBS: true,
  showName: true,
  showStartDate: true,
  showEndDate: true,
  showDuration: true,
  showDeliverable: true,
  showDependencies: false,
  showAssignee: true,
  showPriority: true,
  showStatus: true,
  showMilestone: true,
  showDescription: false
}

// Watch for settings prop changes
watch(() => props.settings, (newSettings) => {
  if (newSettings && typeof newSettings === 'object') {
    Object.assign(localSettings, newSettings)
  }
}, { immediate: true, deep: true })

const selectAll = () => {
  Object.keys(localSettings).forEach(key => {
    localSettings[key] = true
  })
}

const selectNone = () => {
  Object.keys(localSettings).forEach(key => {
    // Always show at least name
    if (key !== 'showName') {
      localSettings[key] = false
    }
  })
}

const resetToDefault = () => {
  Object.assign(localSettings, defaultSettings)
}

const handleClose = () => {
  emit('update:visible', false)
}

const handleSave = () => {
  emit('save', { ...localSettings })
  emit('update:visible', false)
}
</script>

<style scoped>
.display-settings {
  padding: 10px 0;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-switch) {
  margin-left: auto;
}
</style>
