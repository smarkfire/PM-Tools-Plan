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
          <el-button type="success" @click="handleSaveAsTemplate" plain>
            <i class="fa fa-copy mr-1"></i>
            {{ $t('projectTemplate.saveAsTemplate') }}
          </el-button>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>

  <el-dialog
    v-model="saveTemplateDialogVisible"
    :title="$t('projectTemplate.saveAsTemplate')"
    width="480px"
    :close-on-click-modal="false"
  >
    <el-form label-width="100px">
      <el-form-item :label="$t('projectTemplate.templateName')">
        <el-input v-model="templateFormData.name" :placeholder="$t('projectTemplate.inputTemplateName')" />
      </el-form-item>
      <el-form-item :label="$t('projectTemplate.industry')">
        <el-select v-model="templateFormData.industry" :placeholder="$t('projectTemplate.selectIndustry')" style="width: 100%">
          <el-option
            v-for="ind in industryOptions"
            :key="ind"
            :label="ind"
            :value="ind"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('projectTemplate.description')">
        <el-input v-model="templateFormData.description" type="textarea" :rows="3" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="saveTemplateDialogVisible = false">{{ $t('common.buttons.cancel') }}</el-button>
      <el-button type="primary" @click="confirmSaveTemplate" :loading="saveTemplateLoading">{{ $t('common.buttons.save') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useProjectStore } from '~/store/project'
import { useTasksStore } from '~/store/tasks'
import { flattenTasks } from '~/utils/wbs'

const { t } = useI18n()
const projectStore = useProjectStore()
const tasksStore = useTasksStore()

const saveTemplateDialogVisible = ref(false)
const saveTemplateLoading = ref(false)
const templateFormData = reactive({
  name: '',
  industry: '',
  description: '',
})

const industryOptions = [
  t('projectTemplate.industries.it'),
  t('projectTemplate.industries.construction'),
  t('projectTemplate.industries.education'),
  t('projectTemplate.industries.healthcare'),
  t('projectTemplate.industries.finance'),
  t('projectTemplate.industries.manufacturing'),
  t('projectTemplate.industries.retail'),
  t('projectTemplate.industries.government'),
  t('projectTemplate.industries.other'),
]
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

const handleSaveAsTemplate = () => {
  templateFormData.name = formData.name
  templateFormData.industry = ''
  templateFormData.description = formData.description
  saveTemplateDialogVisible.value = true
}

const confirmSaveTemplate = async () => {
  if (!templateFormData.name || !templateFormData.name.trim()) {
    ElMessage.warning(t('projectTemplate.templateNameRequired'))
    return
  }
  if (!templateFormData.industry) {
    ElMessage.warning(t('projectTemplate.industryRequired'))
    return
  }
  saveTemplateLoading.value = true
  try {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      ElMessage.warning(t('projectTemplate.pleaseLogin'))
      return
    }
    const flatTasks = flattenTasks(tasksStore.tasks)
    const phases = []
    const rootTasks = tasksStore.tasks
    if (rootTasks.length > 0) {
      rootTasks.forEach(rootTask => {
        const phaseTasks = (rootTask.children && rootTask.children.length > 0)
          ? rootTask.children.map(child => ({
              name: child.name,
              duration: child.duration || 1,
              deliverable: child.deliverable || '',
            }))
          : [{
              name: rootTask.name,
              duration: rootTask.duration || 1,
              deliverable: rootTask.deliverable || '',
            }]
        phases.push({
          name: rootTask.name,
          tasks: phaseTasks,
        })
      })
    }
    if (phases.length === 0) {
      phases.push({ name: formData.name || 'Default Phase', tasks: [{ name: 'Task 1', duration: 1, deliverable: '' }] })
    }

    const res = await fetch('/api/templates/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: templateFormData.name,
        icon: '📋',
        industry: templateFormData.industry,
        description: templateFormData.description,
        phases,
      }),
    })
    if (res.ok) {
      ElMessage.success(t('projectTemplate.templateSaved'))
      saveTemplateDialogVisible.value = false
    } else {
      ElMessage.error(t('projectTemplate.saveFailed'))
    }
  } catch {
    ElMessage.error(t('projectTemplate.saveFailed'))
  } finally {
    saveTemplateLoading.value = false
  }
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
