<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? t('tasks.form.edit') : t('tasks.form.add')"
    width="700px"
    @close="handleClose"
    :close-on-click-modal="false"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
    >
      <el-form-item :label="t('tasks.form.fields.name')" prop="name">
        <el-input
          v-model="formData.name"
          :placeholder="t('tasks.form.fields.namePlaceholder')"
          clearable
        />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item :label="t('tasks.form.fields.startDate')" prop="startDate">
            <el-date-picker
              v-model="formData.startDate"
              type="date"
              :placeholder="t('project.info.form.selectStartDate')"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
              @change="handleDateChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="t('tasks.form.fields.endDate')" prop="endDate">
            <el-date-picker
              v-model="formData.endDate"
              type="date"
              :placeholder="t('project.info.form.selectEndDate')"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
              :disabled-date="disabledEndDate"
              @change="handleDateChange"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item :label="t('tasks.form.fields.duration')" prop="duration">
            <el-input-number
              v-model="formData.duration"
              :min="1"
              :max="365"
              controls-position="right"
              style="width: 100%"
              @change="handleDurationChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="t('tasks.form.fields.priority')" prop="priority">
            <el-select
              v-model="formData.priority"
              :placeholder="t('tasks.form.fields.priority')"
              style="width: 100%"
            >
              <el-option :label="t('tasks.form.priority.high')" value="高" />
              <el-option :label="t('tasks.form.priority.medium')" value="中" />
              <el-option :label="t('tasks.form.priority.low')" value="低" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item :label="t('tasks.form.fields.status')" prop="status">
            <el-select
              v-model="formData.status"
              :placeholder="t('tasks.form.fields.status')"
              style="width: 100%"
            >
              <el-option :label="t('tasks.form.status.todo')" value="待办" />
              <el-option :label="t('tasks.form.status.inProgress')" value="进行中" />
              <el-option :label="t('tasks.form.status.completed')" value="已完成" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="t('tasks.form.fields.assignee')" prop="assignee">
            <el-select
              v-model="formData.assignee"
              :placeholder="t('tasks.form.fields.assigneePlaceholder')"
              style="width: 100%"
              filterable
              clearable
            >
              <el-option
                v-for="member in members"
                :key="member.value"
                :label="member.label"
                :value="member.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item :label="t('tasks.form.fields.deliverable')" prop="deliverable">
        <el-input
          v-model="formData.deliverable"
          :placeholder="t('tasks.form.fields.deliverablePlaceholder')"
          clearable
        />
      </el-form-item>

      <el-form-item :label="t('tasks.form.fields.milestone')" prop="isMilestone">
        <el-switch
          v-model="formData.isMilestone"
          :active-text="t('common.buttons.yes')"
          :inactive-text="t('common.buttons.no')"
        />
      </el-form-item>

      <el-form-item :label="t('tasks.form.fields.dependencies')" prop="dependencies">
        <el-select
          v-model="formData.dependencies"
          :placeholder="t('tasks.form.fields.dependenciesPlaceholder')"
          style="width: 100%"
          multiple
          filterable
          clearable
        >
          <el-option
            v-for="task in availableDependencies"
            :key="task.id"
            :label="`${task.wbs} - ${task.name}`"
            :value="task.id"
            :disabled="task.id === formData.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item :label="t('tasks.form.fields.description')" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          :placeholder="t('tasks.form.fields.descriptionPlaceholder')"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">{{ t('tasks.form.buttons.cancel') }}</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving">
        {{ t('tasks.form.buttons.save') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { addWorkingDays, calculateDuration } from '~/utils/date'

const { t } = useI18n()

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  task: {
    type: Object,
    default: null
  },
  members: {
    type: Array,
    default: () => []
  },
  allTasks: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:visible', 'save'])

const formRef = ref(null)
const saving = ref(false)

const isEdit = computed(() => !!props.task?.id)

const formData = reactive({
  id: '',
  name: '',
  startDate: '',
  endDate: '',
  duration: 1,
  deliverable: '',
  dependencies: [],
  assignee: '',
  priority: '中',
  status: '待办',
  isMilestone: false,
  description: '',
  parentId: null
})

const rules = {
  name: [
    { required: true, message: () => t('tasks.form.validation.nameRequired'), trigger: 'blur' }
  ],
  startDate: [
    { required: true, message: () => t('tasks.form.validation.startDateRequired'), trigger: 'change' }
  ],
  endDate: [
    { required: true, message: () => t('tasks.form.validation.endDateRequired'), trigger: 'change' }
  ],
  duration: [
    { required: true, message: () => t('tasks.form.validation.durationInvalid'), trigger: 'blur' }
  ]
}

// Available tasks for dependencies (exclude current task and its descendants)
const availableDependencies = computed(() => {
  return props.allTasks.filter(t => t.id !== formData.id)
})

// Reset form function (must be defined before watches)
const resetForm = () => {
  Object.assign(formData, {
    id: '',
    name: '',
    startDate: '',
    endDate: '',
    duration: 1,
    deliverable: '',
    dependencies: [],
    assignee: '',
    priority: '中',
    status: '待办',
    isMilestone: false,
    description: '',
    parentId: props.task?.parentId || null
  })
  formRef.value?.clearValidate()
}

watch(() => props.task, (newTask) => {
  if (newTask) {
    Object.assign(formData, {
      id: newTask.id || '',
      name: newTask.name || '',
      startDate: newTask.startDate || '',
      endDate: newTask.endDate || '',
      duration: newTask.duration || 1,
      deliverable: newTask.deliverable || '',
      dependencies: newTask.dependencies || [],
      assignee: newTask.assignee || '',
      priority: newTask.priority || '中',
      status: newTask.status || '待办',
      isMilestone: newTask.isMilestone || false,
      description: newTask.description || '',
      parentId: newTask.parentId || null
    })
  } else {
    resetForm()
  }
}, { immediate: true, deep: true })

watch(() => props.visible, (newVal) => {
  if (newVal && props.task) {
    Object.assign(formData, {
      id: props.task.id || '',
      name: props.task.name || '',
      startDate: props.task.startDate || '',
      endDate: props.task.endDate || '',
      duration: props.task.duration || 1,
      deliverable: props.task.deliverable || '',
      dependencies: props.task.dependencies || [],
      assignee: props.task.assignee || '',
      priority: props.task.priority || '中',
      status: props.task.status || '待办',
      isMilestone: props.task.isMilestone || false,
      description: props.task.description || '',
      parentId: props.task.parentId || null
    })
  } else if (newVal) {
    // New task - reset form
    resetForm()
  }
})

const handleDateChange = () => {
  if (formData.startDate && formData.endDate) {
    formData.duration = calculateDuration(formData.startDate, formData.endDate)
  } else if (formData.startDate && formData.duration) {
    formData.endDate = addWorkingDays(formData.startDate, formData.duration - 1)
  }
}

const handleDurationChange = () => {
  if (formData.startDate && formData.duration) {
    formData.endDate = addWorkingDays(formData.startDate, formData.duration - 1)
  }
}

const disabledEndDate = (time) => {
  if (!formData.startDate) return false
  return time.getTime() < new Date(formData.startDate).getTime()
}

const handleClose = () => {
  emit('update:visible', false)
  resetForm()
}

const handleSave = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      saving.value = true

      // Prepare task data
      const taskData = {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        duration: formData.duration,
        deliverable: formData.deliverable,
        dependencies: formData.dependencies,
        assignee: formData.assignee,
        priority: formData.priority,
        status: formData.status,
        description: formData.description,
        parentId: formData.parentId
      }

      // Add ID for existing tasks
      if (isEdit.value) {
        taskData.id = formData.id
      }

      emit('save', taskData)

      saving.value = false
    } else {
      ElMessage.error(t('common.messages.error'))
    }
  })
}
</script>

<style scoped>
:deep(.el-form-item__label) {
  font-weight: 500;
}
</style>
