<template>
  <el-dialog
    :model-value="visible"
    title="显示设置"
    width="500px"
    @close="handleClose"
  >
    <div class="display-settings">
      <el-form label-width="120px">
        <el-form-item label="WBS编号">
          <el-switch v-model="localSettings.showWBS" />
        </el-form-item>
        <el-form-item label="任务名称">
          <el-switch v-model="localSettings.showName" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-switch v-model="localSettings.showStartDate" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-switch v-model="localSettings.showEndDate" />
        </el-form-item>
        <el-form-item label="工期">
          <el-switch v-model="localSettings.showDuration" />
        </el-form-item>
        <el-form-item label="交付物">
          <el-switch v-model="localSettings.showDeliverable" />
        </el-form-item>
        <el-form-item label="任务依赖">
          <el-switch v-model="localSettings.showDependencies" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-switch v-model="localSettings.showAssignee" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-switch v-model="localSettings.showPriority" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="localSettings.showStatus" />
        </el-form-item>
        <el-form-item label="备注">
          <el-switch v-model="localSettings.showDescription" />
        </el-form-item>
      </el-form>

      <div class="mt-6 pt-4 border-t">
        <div class="text-sm font-bold mb-3">快捷操作</div>
        <div class="flex gap-2">
          <el-button size="small" @click="selectAll">全选</el-button>
          <el-button size="small" @click="selectNone">全不选</el-button>
          <el-button size="small" @click="resetToDefault">默认设置</el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave">
        保存设置
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, watch } from 'vue'

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
