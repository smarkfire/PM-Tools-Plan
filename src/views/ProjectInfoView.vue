<template>
  <div class="project-info-view">
    <el-card class="mb-6">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold">
            <i class="fa fa-info-circle text-primary mr-2"></i>
            项目信息管理
          </h2>
          <!-- <div class="flex gap-2">
            <el-button @click="handleImport" type="warning" size="small">
              <i class="fa fa-upload mr-1"></i>
              导入项目信息
            </el-button>
            <el-dropdown @command="handleExport" split-button type="primary" size="small">
              <i class="fa fa-download mr-1"></i>
              导出项目信息
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="json">JSON 格式</el-dropdown-item>
                  <el-dropdown-item command="excel">Excel 格式</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div> -->
        </div>
      </template>

      <ProjectInfoForm />
    </el-card>

    <el-card>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold">
            <i class="fa fa-users text-primary mr-2"></i>
            项目人员管理
          </h2>
          <!-- <el-button @click="handleAddMember" type="primary" size="small">
            <i class="fa fa-plus mr-1"></i>
            新增人员
          </el-button> -->
        </div>
      </template>

      <MemberManager />
    </el-card>

    <!-- Import Dialog -->
    <el-dialog v-model="importDialogVisible" title="导入项目信息" width="500px">
      <el-upload
        ref="uploadRef"
        class="upload-demo"
        drag
        :auto-upload="false"
        :on-change="handleFileChange"
        :limit="1"
        accept=".json,.xlsx,.xls"
      >
        <i class="fa fa-cloud-upload-alt text-4xl text-primary mb-4"></i>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 JSON 和 Excel 格式，文件大小不超过 10MB
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImportConfirm" :loading="importing">
          确认导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useProjectStore } from '@/store/project'
import { importFromJSON, importFromExcel } from '@/utils/import'
import ProjectInfoForm from '@/components/ProjectInfo/ProjectInfoForm.vue'
import MemberManager from '@/components/ProjectInfo/MemberManager.vue'

const projectStore = useProjectStore()
const importDialogVisible = ref(false)
const importing = ref(false)
const uploadRef = ref(null)
const selectedFile = ref(null)

onMounted(() => {
  projectStore.loadFromLocalStorage()
})

const handleImport = () => {
  importDialogVisible.value = true
  selectedFile.value = null
}

const handleFileChange = (file) => {
  selectedFile.value = file.raw
}

const handleImportConfirm = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请选择要导入的文件')
    return
  }

  importing.value = true

  try {
    const filename = selectedFile.value.name.toLowerCase()
    let result

    if (filename.endsWith('.json')) {
      result = await importFromJSON(selectedFile.value)
      if (result.success && result.project) {
        projectStore.importFromJSON(JSON.stringify(result.project))
        ElMessage.success('项目信息导入成功')
      }
    } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      result = await importFromExcel(selectedFile.value)
      if (result.success && result.project) {
        projectStore.setProjectInfo(result.project)
        ElMessage.success('项目信息导入成功')
      }
    } else {
      ElMessage.error('不支持的文件格式')
      importing.value = false
      return
    }

    if (!result.success) {
      ElMessage.error(`导入失败: ${result.error}`)
    }

    importDialogVisible.value = false
  } catch (error) {
    ElMessage.error(`导入失败: ${error.message}`)
  } finally {
    importing.value = false
  }
}

const handleExport = (format) => {
  try {
    const projectData = projectStore.project

    if (format === 'json') {
      const json = JSON.stringify(projectData, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      downloadBlob(blob, `project-info-${Date.now()}.json`)
      ElMessage.success('导出成功')
    } else if (format === 'excel') {
      // Use export utility (will implement later)
      ElMessage.info('Excel 导出功能开发中')
    }
  } catch (error) {
    ElMessage.error(`导出失败: ${error.message}`)
  }
}

const handleAddMember = () => {
  // This will be handled by MemberManager component
  ElMessage.info('请在下方表格中添加人员信息')
}

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.project-info-view {
  max-width: 1200px;
  margin: 0 auto;
}

.upload-demo {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
}
</style>
