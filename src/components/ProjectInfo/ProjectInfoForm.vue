<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="120px"
    class="project-info-form"
  >
    <el-row :gutter="20">
      <el-col :span="24">
        <el-form-item label="项目名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入项目名称"
            clearable
            @input="handleInputChange"
          />
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker
            v-model="formData.startDate"
            type="date"
            placeholder="选择开始日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            @change="handleInputChange"
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
            @change="handleInputChange"
          />
        </el-form-item>
      </el-col>

      <el-col :span="24">
        <el-form-item label="备注" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="请输入项目备注信息"
            @input="handleInputChange"
          />
        </el-form-item>
      </el-col>

      <el-col :span="24">
        <el-form-item>
          <el-button type="primary" @click="handleSave">
            <i class="fa fa-save mr-1"></i>
            保存项目信息
          </el-button>
          <el-button @click="handleReset">
            <i class="fa fa-undo mr-1"></i>
            重置
          </el-button>
          <el-button type="danger" @click="handleClear" plain>
            <i class="fa fa-trash mr-1"></i>
            清空
          </el-button>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useProjectStore } from '@/store/project'

const projectStore = useProjectStore()
const formRef = ref(null)

const formData = reactive({
  name: '',
  startDate: '',
  endDate: '',
  description: ''
})

const rules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' }
  ],
  startDate: [
    { required: true, message: '请选择开始日期', trigger: 'change' }
  ],
  endDate: [
    { required: true, message: '请选择结束日期', trigger: 'change' }
  ]
}

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
      ElMessage.success('项目信息保存成功')
    } else {
      ElMessage.error('请检查表单填写是否正确')
    }
  })
}

const handleReset = () => {
  loadProjectData()
  ElMessage.info('已重置为原始数据')
}

const handleClear = () => {
  ElMessageBox.confirm(
    '确定要清空所有项目信息吗？此操作不可恢复。',
    '确认清空',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
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
    ElMessage.success('已清空项目信息')
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
