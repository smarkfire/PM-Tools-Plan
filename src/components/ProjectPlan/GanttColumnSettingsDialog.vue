<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="$t('tasks.settings.ganttColumns.title')"
    width="400px"
    :before-close="handleClose"
  >
    <div class="column-settings">
      <el-checkbox-group v-model="selectedColumns">
        <div v-for="column in availableColumns" :key="column.name" class="column-item">
          <el-checkbox :label="column.name">
            {{ column.label }}
          </el-checkbox>
        </div>
      </el-checkbox-group>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleReset">{{ $t('common.buttons.reset') }}</el-button>
        <el-button @click="handleClose">{{ $t('common.buttons.cancel') }}</el-button>
        <el-button type="primary" @click="handleSave">{{ $t('common.buttons.save') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
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

// Available columns in Gantt chart with i18n
const availableColumns = computed(() => [
  { name: 'wbs', label: t('gantt.columns.wbs') },
  { name: 'text', label: t('gantt.columns.name') },
  { name: 'duration', label: t('gantt.columns.duration') },
  { name: 'start_date', label: t('gantt.columns.startDate') },
  { name: 'end_date', label: t('gantt.columns.endDate') },
  { name: 'priority', label: t('gantt.columns.priority') },
  { name: 'assignee', label: t('gantt.columns.assignee') },
  { name: 'deliverable', label: t('gantt.columns.deliverable') },
  { name: 'dependencies', label: t('gantt.columns.dependencies') },
  { name: 'status', label: t('gantt.columns.status') },
  { name: 'description', label: t('gantt.columns.description') },
  { name: 'actions', label: t('gantt.columns.actions') }
])

// Default settings
const defaultSettings = {
  wbs: true,
  text: true,
  duration: true,
  start_date: true,
  end_date: true,
  priority: true,
  assignee: true,
  deliverable: true,
  dependencies: true,
  status: true,
  description: false, // Description hidden by default as it's long
  actions: true
}

const selectedColumns = ref([])

// Initialize selected columns from props
const initSelectedColumns = () => {
  selectedColumns.value = availableColumns.value
    .filter(col => props.settings[col.name] !== false)
    .map(col => col.name)
}

// Watch for visible changes
watch(() => props.visible, (newVal) => {
  if (newVal) {
    initSelectedColumns()
  }
})

const handleClose = () => {
  emit('update:visible', false)
}

const handleReset = () => {
  selectedColumns.value = availableColumns.value.map(col => col.name)
}

const handleSave = () => {
  const newSettings = {}
  availableColumns.value.forEach(col => {
    newSettings[col.name] = selectedColumns.value.includes(col.name)
  })

  emit('save', newSettings)
  emit('update:visible', false)
}
</script>

<style scoped>
.column-settings {
  padding: 10px 0;
}

.column-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.column-item:last-child {
  border-bottom: none;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
