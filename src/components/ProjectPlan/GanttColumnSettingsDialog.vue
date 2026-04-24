<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="甘特图列设置"
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
        <el-button @click="handleReset">重置</el-button>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

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

// Available columns in Gantt chart
const availableColumns = [
  { name: 'wbs', label: 'WBS' },
  { name: 'text', label: '任务名称' },
  { name: 'duration', label: '工期' },
  { name: 'start_date', label: '开始日期' },
  { name: 'end_date', label: '结束日期' },
  { name: 'status', label: '状态' },
  { name: 'actions', label: '操作' }
]

// Default settings
const defaultSettings = {
  wbs: true,
  text: true,
  duration: true,
  start_date: true,
  end_date: true,
  status: true,
  actions: true
}

const selectedColumns = ref([])

// Initialize selected columns from props
const initSelectedColumns = () => {
  selectedColumns.value = availableColumns
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
  selectedColumns.value = availableColumns.map(col => col.name)
}

const handleSave = () => {
  const newSettings = {}
  availableColumns.forEach(col => {
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
