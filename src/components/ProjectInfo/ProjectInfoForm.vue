<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    :label-width="$t('project.info.form.labelWidth') || '120px'"
    class="project-info-form"
  >
    <el-row :gutter="20">
      <el-col :span="24">
        <el-form-item :label="$t('project.info.form.name')" prop="name">
          <el-input
            v-model="formData.name"
            :placeholder="$t('project.info.form.namePlaceholder')"
            clearable
            @input="handleInputChange"
          />
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item :label="$t('project.info.form.startDate')" prop="startDate">
          <el-date-picker
            v-model="formData.startDate"
            type="date"
            :placeholder="$t('project.info.form.selectStartDate')"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            @change="handleInputChange"
          />
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item :label="$t('project.info.form.endDate')" prop="endDate">
          <el-date-picker
            v-model="formData.endDate"
            type="date"
            :placeholder="$t('project.info.form.selectEndDate')"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            :disabled-date="disabledEndDate"
            @change="handleInputChange"
          />
        </el-form-item>
      </el-col>

      <el-col :span="24">
        <el-form-item :label="$t('project.info.form.description')" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            :placeholder="$t('project.info.form.descriptionPlaceholder')"
            @input="handleInputChange"
          />
        </el-form-item>
      </el-col>

      <el-col :span="24">
        <el-form-item>
          <el-button type="primary" @click="handleSave">
            <i class="fa fa-save mr-1"></i>
            {{ $t('project.info.actions.saveInfo') }}
          </el-button>
          <el-button @click="handleReset">
            <i class="fa fa-undo mr-1"></i>
            {{ $t('common.buttons.reset') }}
          </el-button>
          <el-button type="danger" @click="handleClear" plain>
            <i class="fa fa-trash mr-1"></i>
            {{ $t('common.buttons.clear') }}
          </el-button>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup>
import { ref, reactive, watch, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useProjectStore } from '~/store/project'

const { t } = useI18n()
const projectStore = useProjectStore()
const formRef = ref(null)

const formData = reactive({
  name: '',
  startDate: '',
  endDate: '',
  description: ''
})

const rules = computed(() => ({
  name: [
    { required: true, message: t('project.info.validation.nameRequired'), trigger: 'blur' }
  ],
  startDate: [
    { required: true, message: t('project.info.validation.startDateRequired'), trigger: 'change' }
  ],
  endDate: [
    { required: true, message: t('project.info.validation.endDateRequired'), trigger: 'change' }
  ]
}))

onMounted(() => {
  loadProjectData()
})

// Watch for changes in store
watch(() => projectStore.project, (newProject) => {
  Object.assign(formData, {
    name: newProject.name || '',
    startDate: newProject.startDate || '',
    endDate: newProject.endDate || '',
    description: newProject.description || ''
  })
}, { deep: true })

const loadProjectData = () => {
  const project = projectStore.project
  Object.assign(formData, {
    name: project.name || '',
    startDate: project.startDate || '',
    endDate: project.endDate || '',
    description: project.description || ''
  })
}

const handleInputChange = () => {
  // Auto-save on input change (debounced in real implementation)
  projectStore.setProjectInfo(formData)
}

const handleSave = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      projectStore.setProjectInfo(formData)
      ElMessage.success(t('project.info.messages.saved'))
    } else {
      ElMessage.error(t('validation.required'))
    }
  })
}

const handleReset = () => {
  loadProjectData()
  ElMessage.info(t('project.info.messages.reset'))
}

const handleClear = () => {
  ElMessageBox.confirm(
    t('project.info.messages.confirmClear'),
    t('common.messages.confirmDelete'),
    {
      confirmButtonText: t('common.buttons.confirm'),
      cancelButtonText: t('common.buttons.cancel'),
      type: 'warning'
    }
  ).then(() => {
    Object.assign(formData, {
      name: '',
      startDate: '',
      endDate: '',
      description: ''
    })
    projectStore.setProjectInfo(formData)
    ElMessage.success(t('project.info.messages.cleared'))
  }).catch(() => {
    // User cancelled
  })
}

const disabledEndDate = (time) => {
  if (!formData.startDate) return false
  return time.getTime() < new Date(formData.startDate).getTime()
}
</script>

<style scoped>
.project-info-form {
  padding: 10px 0;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}
</style>
