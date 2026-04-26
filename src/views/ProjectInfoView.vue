<template>
  <div class="project-info-view">
    <el-card class="mb-6">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold">
            <i class="fa fa-info-circle text-primary mr-2"></i>
            {{ $t('project.info.title') }}
          </h2>
          <!-- <div class="flex gap-2">
            <el-button @click="handleImport" type="warning" size="small">
              <i class="fa fa-upload mr-1"></i>
              {{ $t('project.import.title') }}
            </el-button>
            <el-dropdown @command="handleExport" split-button type="primary" size="small">
              <i class="fa fa-download mr-1"></i>
              {{ $t('project.info.actions.exportExcel') }}
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="json">{{ $t('project.import.formats.json') }} {{ $t('common.buttons.format') }}</el-dropdown-item>
                  <el-dropdown-item command="excel">{{ $t('project.import.formats.excel') }} {{ $t('common.buttons.format') }}</el-dropdown-item>
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
            {{ $t('project.members.title') }}
          </h2>
          <!-- <el-button @click="handleAddMember" type="primary" size="small">
            <i class="fa fa-plus mr-1"></i>
            {{ $t('project.members.form.name') }}
          </el-button> -->
        </div>
      </template>

      <MemberManager />
    </el-card>

    <!-- Import Dialog -->
    <el-dialog v-model="importDialogVisible" :title="$t('project.import.title')" width="500px">
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
          {{ $t('project.import.upload.dragText') }}<em>{{ $t('project.import.upload.clickText') }}</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            {{ $t('project.import.upload.tip') }}
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">{{ $t('common.buttons.cancel') }}</el-button>
        <el-button type="primary" @click="handleImportConfirm" :loading="importing">
          {{ $t('project.import.buttons.confirmImport') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useProjectStore } from '@/store/project'
import { importFromJSON, importFromExcel } from '@/utils/import'
import ProjectInfoForm from '@/components/ProjectInfo/ProjectInfoForm.vue'
import MemberManager from '@/components/ProjectInfo/MemberManager.vue'

const { t } = useI18n()
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
    ElMessage.warning(t('project.import.messages.selectFile'))
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
        ElMessage.success(t('project.import.messages.importSuccess'))
      }
    } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      result = await importFromExcel(selectedFile.value)
      if (result.success && result.project) {
        projectStore.setProjectInfo(result.project)
        ElMessage.success(t('project.import.messages.importSuccess'))
      }
    } else {
      ElMessage.error(t('project.info.messages.fileFormatInvalid'))
      importing.value = false
      return
    }

    if (!result.success) {
      ElMessage.error(t('project.import.messages.importFailed', { error: result.error }))
    }

    importDialogVisible.value = false
  } catch (error) {
    ElMessage.error(t('project.import.messages.importFailed', { error: error.message }))
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
      ElMessage.success(t('project.info.messages.exportSuccess'))
    } else if (format === 'excel') {
      // Use export utility (will implement later)
      ElMessage.info('Excel export feature in development')
    }
  } catch (error) {
    ElMessage.error(t('project.info.messages.exportFailed', { error: error.message }))
  }
}

const handleAddMember = () => {
  // This will be handled by MemberManager component
  ElMessage.info('Please add member information in the table below')
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
