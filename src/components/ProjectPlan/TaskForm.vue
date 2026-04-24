<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '编辑任务' : '新增任务'"
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
      <el-form-item label="任务名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入任务名称"
          clearable
        />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="开始日期" prop="startDate">
            <el-date-picker
              v-model="formData.startDate"
              type="date"
              placeholder="选择开始日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
              @change="handleDateChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="结束日期" prop="endDate">
            <el-date-picker
              v-model="formData.endDate"
              type="date"
              placeholder="选择结束日期"
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
          <el-form-item label="工期（天）" prop="duration">
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
          <el-form-item label="优先级" prop="priority">
            <el-select
              v-model="formData.priority"
              placeholder="请选择优先级"
              style="width: 100%"
            >
              <el-option label="高" value="高" />
              <el-option label="中" value="中" />
              <el-option label="低" value="低" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select
              v-model="formData.status"
              placeholder="请选择状态"
              style="width: 100%"
            >
              <el-option label="待办" value="待办" />
              <el-option label="进行中" value="进行中" />
              <el-option label="已完成" value="已完成" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="负责人" prop="assignee">
            <el-select
              v-model="formData.assignee"
              placeholder="请选择负责人"
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

      <el-form-item label="交付物" prop="deliverable">
        <el-input
          v-model="formData.deliverable"
          placeholder="请输入交付物"
          clearable
        />
      </el-form-item>

      <el-form-item label="任务依赖" prop="dependencies">
        <el-select
          v-model="formData.dependencies"
          placeholder="请选择依赖的任务"
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

      <el-form-item label="备注" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入任务备注"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { addWorkingDays, calculateDuration } from '@/utils/date'

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
  description: '',
  parentId: null
})

const rules = {
  name: [
    { required: true, message: '请输入任务名称', trigger: 'blur' }
  ],
  startDate: [
    { required: true, message: '请选择开始日期', trigger: 'change' }
  ],
  endDate: [
    { required: true, message: '请选择结束日期', trigger: 'change' }
  ],
  duration: [
    { required: true, message: '请输入工期', trigger: 'blur' }
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
    description: '',
    parentId: props.task?.parentId || null
  })
  formRef.value?.clearValidate()
}

// Watch for task prop changes to populate form
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
      description: newTask.description || '',
      parentId: newTask.parentId || null
    })
  } else {
    resetForm()
  }
}, { immediate: true, deep: true })

// Watch for dialog open/close
watch(() => props.visible, (newVal) => {
  if (newVal && props.task) {
    // Reset form with task data when opening
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
      ElMessage.error('请检查表单填写是否正确')
    }
  })
}
</script>

<style scoped>
:deep(.el-form-item__label) {
  font-weight: 500;
}
</style>
