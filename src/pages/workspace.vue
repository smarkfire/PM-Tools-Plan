<template>
  <div class="workspace-page">
    <div class="workspace-header">
      <div class="workspace-header-inner">
        <div class="workspace-title-group">
          <h1 class="workspace-title">{{ $t('workspace.title') }}</h1>
          <span class="workspace-subtitle">{{ $t('workspace.subtitle') }}</span>
        </div>
        <div class="workspace-header-actions">
          <el-button type="primary" @click="showAIWizard = true" :disabled="!aiAvailable">
            <i class="fa fa-magic mr-1"></i>
            {{ $t('ai.wizard.title') }}
          </el-button>
        </div>
      </div>
    </div>

    <div class="workspace-body">
      <AIStatusBanner />

      <div class="workspace-tabs-bar">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="workspace-tab"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <i :class="tab.icon" class="tab-icon"></i>
          <span class="tab-label">{{ $t(tab.label) }}</span>
        </button>
      </div>

      <div class="workspace-content">
        <transition name="tab-fade" mode="out-in">
          <div v-if="activeTab === 'info'" key="info" class="tab-panel">
            <div class="project-info-view">
              <el-card class="workspace-card">
                <template #header>
                  <div class="card-header">
                    <h2 class="card-title">
                      <i class="fa fa-info-circle text-primary mr-2"></i>
                      {{ $t('project.info.title') }}
                    </h2>
                  </div>
                </template>
                <ProjectInfoForm />
              </el-card>

              <el-card class="workspace-card">
                <template #header>
                  <div class="card-header">
                    <h2 class="card-title">
                      <i class="fa fa-users text-primary mr-2"></i>
                      {{ $t('project.members.title') }}
                    </h2>
                  </div>
                </template>
                <MemberManager />
              </el-card>
            </div>

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

          <div v-else key="plan" class="tab-panel">
            <div class="project-plan-view">
              <el-card class="workspace-card plan-card">
                <template #header>
                  <Toolbar
                    :show-task-list="showTaskList"
                    @add-root-task="handleAddRootTask"
                    @save="handleSave"
                    @import="handleImportWithFormat"
                    @export="handleExportWithFormat"
                    @export-gantt="handleExportGantt"
                    @toggle-expand="handleToggleExpand"
                    @open-display-settings="handleOpenDisplaySettings"
                    @data-action="handleDataAction"
                    @toggle-task-list-visibility="handleToggleTaskListVisibility"
                    @open-gantt-column-settings="handleOpenGanttColumnSettings"
                  />
                </template>

                <div class="split-pane">
                  <div
                    class="split-pane-left"
                    :class="{ 'task-list-hidden': !showTaskList }"
                    :style="{ width: uiStore.leftPaneWidth }"
                  >
                    <TaskList
                      v-show="showTaskList"
                      :tasks="taskListData"
                      :display-settings="tasksStore.displaySettings"
                      :expanded-tasks="tasksStore.expandedTasks"
                      @edit-task="handleEditTask"
                      @delete-task="handleDeleteTask"
                      @add-child-task="handleAddChildTask"
                      @reorder-task="handleReorderTask"
                      @toggle-expand="handleToggleTaskExpand"
                    />
                  </div>

                  <div
                    v-show="showTaskList"
                    class="split-pane-divider"
                    @mousedown="handleDividerMouseDown"
                  ></div>

                  <div class="split-pane-right">
                    <ClientOnly>
                      <LazyGanttChart
                        ref="ganttChartRef"
                        :tasks="tasksStore.tasks"
                        :column-settings="ganttColumnSettings"
                        :key="tasksStore.lastSaved || 'gantt'"
                        @edit-task="handleEditTaskFromGantt"
                        @task-updated="handleTaskUpdatedFromGantt"
                        @add-child-task="handleAddChildTaskFromGantt"
                        @reorder-task="handleReorderTask"
                        @delete-task="handleDeleteTaskFromGantt"
                      />
                    </ClientOnly>
                  </div>
                </div>
              </el-card>

              <TaskForm
                v-model:visible="taskFormVisible"
                :task="currentTask"
                :members="projectStore.memberOptions"
                :all-tasks="tasksStore.flatTaskList"
                @save="handleSaveTask"
              />

              <DisplaySettingsDialog
                v-model:visible="displaySettingsVisible"
                :settings="tasksStore.displaySettings"
                @save="handleSaveDisplaySettings"
              />

              <GanttColumnSettingsDialog
                v-model:visible="ganttColumnSettingsVisible"
                :settings="ganttColumnSettings"
                @save="handleSaveGanttColumnSettings"
              />

              <el-dialog v-model="planImportDialogVisible" :title="$t('tasks.plan.import.title')" width="500px">
                <div class="import-format-info">
                  <el-tag>{{ getImportFormatLabel(selectedImportFormat) }}</el-tag>
                  <span class="ml-2">{{ $t('tasks.plan.import.format') }}</span>
                </div>
                <el-upload
                  ref="planUploadRef"
                  class="upload-demo"
                  drag
                  :auto-upload="false"
                  :on-change="handlePlanFileChange"
                  :limit="1"
                  :accept="getImportFileAccept(selectedImportFormat)"
                >
                  <i class="fa fa-cloud-upload-alt text-4xl text-primary mb-4"></i>
                  <div class="el-upload__text">
                    {{ $t('tasks.plan.import.upload.dragText') }}<em>{{ $t('tasks.plan.import.upload.clickText') }}</em>
                  </div>
                  <template #tip>
                    <div class="el-upload__tip">
                      {{ getImportFileTip(selectedImportFormat) }}
                    </div>
                  </template>
                </el-upload>
                <template #footer>
                  <el-button @click="planImportDialogVisible = false">{{ $t('common.buttons.cancel') }}</el-button>
                  <el-button type="primary" @click="handlePlanImportConfirm" :loading="planImporting">
                    {{ $t('tasks.plan.import.buttons.confirmImport') }}
                  </el-button>
                </template>
              </el-dialog>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <AIProjectWizard v-model="showAIWizard" />
    <AIFloatingButton />
    <AIChatDrawer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useProjectStore } from '~/store/project'
import { useTasksStore } from '~/store/tasks'
import { useUIStore } from '~/store/ui'
import { importFromJSON, importFromExcel, importFromMarkdown } from '~/utils/import'
import { exportProjectData } from '~/utils/export'
import { loadEnhancedMockData, clearAllData } from '~/utils/mockHelper'
import ProjectInfoForm from '~/components/ProjectInfo/ProjectInfoForm.vue'
import MemberManager from '~/components/ProjectInfo/MemberManager.vue'
import Toolbar from '~/components/ProjectPlan/Toolbar.vue'
import TaskList from '~/components/ProjectPlan/TaskList.vue'
import TaskForm from '~/components/ProjectPlan/TaskForm.vue'
import DisplaySettingsDialog from '~/components/ProjectPlan/DisplaySettingsDialog.vue'
import GanttColumnSettingsDialog from '~/components/ProjectPlan/GanttColumnSettingsDialog.vue'

const { t } = useI18n()
const projectStore = useProjectStore()
const tasksStore = useTasksStore()
const uiStore = useUIStore()

const activeTab = ref('info')
const showAIWizard = ref(false)
const { aiAvailable } = useAIAvailability()

const tabs = [
  { key: 'info', label: 'workspace.tabs.info', icon: 'fa fa-info-circle' },
  { key: 'plan', label: 'workspace.tabs.plan', icon: 'fa fa-project-diagram' }
]

const importDialogVisible = ref(false)
const importing = ref(false)
const uploadRef = ref(null)
const selectedFile = ref(null)

const ganttChartRef = ref(null)
const taskFormVisible = ref(false)
const currentTask = ref(null)
const displaySettingsVisible = ref(false)
const planImportDialogVisible = ref(false)
const planImporting = ref(false)
const planUploadRef = ref(null)
const planSelectedFile = ref(null)
const selectedImportFormat = ref('json')
const showTaskList = ref(false)
const ganttColumnSettingsVisible = ref(false)
const ganttColumnSettings = ref({
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
  actions: true
})

const taskListData = computed(() => tasksStore.tasks)

watch(() => tasksStore.tasks, (newTasks) => {
  console.log('Tasks updated, count:', newTasks?.length || 0)
}, { deep: true })

onMounted(() => {
  projectStore.loadFromLocalStorage()
  tasksStore.loadFromLocalStorage()
  uiStore.loadFromLocalStorage()
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})

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

const handleAddRootTask = () => {
  currentTask.value = null
  taskFormVisible.value = true
}

const handleSave = () => {
  tasksStore.saveToLocalStorage()
  ElMessage.success(t('tasks.plan.messages.saved'))
}

const handleImportWithFormat = (format) => {
  planImportDialogVisible.value = true
  planSelectedFile.value = null
  selectedImportFormat.value = format
}

const getImportFormatLabel = (format) => t(`tasks.plan.import.formats.${format}`)

const getImportFileAccept = (format) => t(`tasks.plan.import.accept.${format}`)

const getImportFileTip = (format) => {
  const tipKey = `tasks.plan.import.upload.tip.${format}`
  const tip = t(tipKey)
  return tip !== tipKey ? tip : t('tasks.plan.import.upload.tip.all')
}

const handleExportWithFormat = (format) => {
  try {
    const success = exportProjectData(
      projectStore.project,
      tasksStore.tasks,
      format,
      `project-plan-${Date.now()}`,
      t
    )
    if (success) {
      ElMessage.success(t('tasks.plan.messages.exportSuccess'))
    } else {
      ElMessage.error(t('tasks.plan.messages.exportFailed'))
    }
  } catch (error) {
    ElMessage.error(t('tasks.plan.messages.exportFailed') + ': ' + error.message)
  }
}

const handleExportGantt = () => {
  if (ganttChartRef.value && ganttChartRef.value.exportToPNG) {
    ganttChartRef.value.exportToPNG().then(() => {
      ElMessage.success(t('tasks.plan.messages.ganttExportSuccess'))
    }).catch((error) => {
      ElMessage.error(t('tasks.plan.messages.ganttExportFailed', { error: error.message }))
    })
  } else {
    ElMessage.warning(t('tasks.plan.messages.ganttNotAvailable'))
  }
}

const handleToggleExpand = () => {
  const allExpanded = Array.from(tasksStore.expandedTasks).length === tasksStore.flatTaskList.length
  if (allExpanded) {
    tasksStore.collapseAll()
    ElMessage.info(t('tasks.plan.messages.collapseAll'))
  } else {
    tasksStore.expandAll()
    ElMessage.info(t('tasks.plan.messages.expandAll'))
  }
}

const handleOpenDisplaySettings = () => {
  displaySettingsVisible.value = true
}

const handleOpenGanttColumnSettings = () => {
  ganttColumnSettingsVisible.value = true
}

const handleSaveGanttColumnSettings = (settings) => {
  ganttColumnSettings.value = settings
  ElMessage.success(t('tasks.settings.ganttColumns.messages.saved'))
}

const handleDataAction = (action) => {
  if (action === 'load-mock') {
    handleLoadMockData()
  } else if (action === 'clear-all') {
    handleClearAllData()
  }
}

const handleLoadMockData = () => {
  ElMessageBox.confirm(
    t('tasks.plan.messages.confirmLoadMock'),
    t('common.messages.confirmDelete'),
    {
      confirmButtonText: t('common.buttons.confirm'),
      cancelButtonText: t('common.buttons.cancel'),
      type: 'warning'
    }
  ).then(() => {
    const success = loadEnhancedMockData()
    if (success) {
      projectStore.loadFromLocalStorage()
      tasksStore.loadFromLocalStorage()
      uiStore.loadFromLocalStorage()
      ElMessage.success(t('tasks.plan.messages.mockDataLoaded'))
    } else {
      ElMessage.error(t('tasks.plan.messages.mockDataFailed'))
    }
  }).catch(() => {})
}

const handleClearAllData = () => {
  ElMessageBox.confirm(
    t('tasks.plan.messages.confirmClearAll'),
    t('common.messages.confirmDelete'),
    {
      confirmButtonText: t('common.buttons.confirm'),
      cancelButtonText: t('common.buttons.cancel'),
      type: 'error'
    }
  ).then(() => {
    const success = clearAllData()
    if (success) {
      projectStore.clearProject()
      tasksStore.clearTasks()
      uiStore.splitRatio = 0.4
      uiStore.isSplitPaneDragging = false
      localStorage.removeItem('plan-tools-ui')
      ElMessage.success(t('tasks.plan.messages.dataCleared'))
    } else {
      ElMessage.error(t('tasks.plan.messages.clearFailed'))
    }
  }).catch(() => {})
}

const handleToggleTaskListVisibility = () => {
  showTaskList.value = !showTaskList.value
}

const handleEditTask = (task) => {
  currentTask.value = { ...task }
  taskFormVisible.value = true
}

const handleEditTaskFromGantt = (task) => {
  const fullTask = tasksStore.taskById(task.id)
  if (fullTask) {
    currentTask.value = { ...fullTask, ...task }
  } else {
    currentTask.value = { ...task }
  }
  taskFormVisible.value = true
}

const handleTaskUpdatedFromGantt = (taskData) => {
  tasksStore.updateTask(taskData.id, {
    startDate: taskData.startDate,
    endDate: taskData.endDate,
    duration: taskData.duration
  })
  ElMessage.success(t('gantt.chart.messages.taskUpdated'))
}

const handleAddChildTaskFromGantt = (parentTask) => {
  currentTask.value = {
    parentId: parentTask.id,
    parentName: parentTask.name
  }
  taskFormVisible.value = true
}

const handleDeleteTaskFromGantt = (taskId) => {
  tasksStore.deleteTask(taskId)
  ElMessage.success(t('tasks.list.messages.taskDeleted'))
}

const handleDeleteTask = (task) => {
  tasksStore.deleteTask(task.id)
  ElMessage.success(t('tasks.list.messages.taskDeleted'))
}

const handleAddChildTask = (parentTask) => {
  currentTask.value = {
    parentId: parentTask.id,
    parentName: parentTask.name
  }
  taskFormVisible.value = true
}

const handleReorderTask = (taskId, direction) => {
  tasksStore.reorderTasks(taskId, direction)
}

const handleToggleTaskExpand = (taskId) => {
  tasksStore.toggleTaskExpand(taskId)
}

const handleSaveTask = (taskData) => {
  if (currentTask.value && currentTask.value.id) {
    tasksStore.updateTask(currentTask.value.id, taskData)
    ElMessage.success(t('tasks.form.messages.updateSuccess'))
    taskFormVisible.value = false
  } else {
    try {
      tasksStore.addTask({
        ...taskData,
        parentId: taskData.parentId || null
      })
      ElMessage.success(t('tasks.form.messages.addSuccess'))
      taskFormVisible.value = false
    } catch (error) {
      ElMessage.error(t('tasks.form.messages.addFailed', { error: error.message }))
    }
  }
}

const handleSaveDisplaySettings = (settings) => {
  tasksStore.updateDisplaySettings(settings)
  ElMessage.success(t('tasks.settings.display.messages.saved'))
}

const handlePlanFileChange = (file) => {
  planSelectedFile.value = file.raw
}

const handlePlanImportConfirm = async () => {
  if (!planSelectedFile.value) {
    ElMessage.warning(t('tasks.plan.import.messages.selectFile'))
    return
  }
  planImporting.value = true
  try {
    let result
    switch (selectedImportFormat.value) {
      case 'json':
        result = await importFromJSON(planSelectedFile.value)
        break
      case 'excel':
        result = await importFromExcel(planSelectedFile.value)
        break
      case 'markdown':
        result = await importFromMarkdown(planSelectedFile.value)
        break
      default:
        result = await importFromJSON(planSelectedFile.value)
    }
    if (result.success) {
      if (result.project) {
        projectStore.importFromJSON(JSON.stringify(result.project))
      }
      if (result.tasks && result.tasks.length > 0) {
        tasksStore.tasks = result.tasks
        tasksStore.generateAndSaveWBS()
        ElMessage.success(t('tasks.plan.import.messages.importSuccess'))
        planImportDialogVisible.value = false
      } else {
        ElMessage.warning(t('tasks.plan.import.messages.noTasksInFile'))
      }
    } else {
      ElMessage.error(t('tasks.plan.import.messages.importFailed', { error: result.error }))
    }
  } catch (error) {
    ElMessage.error(t('tasks.plan.import.messages.importFailed', { error: error.message }))
  } finally {
    planImporting.value = false
  }
}

const handleDividerMouseDown = () => {
  uiStore.startDragging()
}

const handleMouseMove = (e) => {
  if (!uiStore.isSplitPaneDragging) return
  const container = document.querySelector('.split-pane')
  if (!container) return
  const containerRect = container.getBoundingClientRect()
  const newRatio = (e.clientX - containerRect.left) / containerRect.width
  uiStore.setSplitRatio(newRatio)
}

const handleMouseUp = () => {
  if (uiStore.isSplitPaneDragging) {
    uiStore.stopDragging()
  }
}
</script>

<style scoped>
.workspace-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f4f6f9;
}

.workspace-header {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 1.75rem 2rem;
  position: relative;
  overflow: hidden;
}

.workspace-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(66, 133, 244, 0.15), transparent 70%);
  pointer-events: none;
}

.workspace-header::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: 10%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(52, 168, 83, 0.1), transparent 70%);
  pointer-events: none;
}

.workspace-header-inner {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.workspace-header-actions {
  flex-shrink: 0;
}

.workspace-title-group {
  display: flex;
  align-items: baseline;
  gap: 1rem;
}

.workspace-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.02em;
  margin: 0;
}

.workspace-subtitle {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 400;
}

.workspace-body {
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 0 2rem 2rem;
}

.workspace-tabs-bar {
  display: flex;
  gap: 0.25rem;
  padding: 1.25rem 0 0;
}

.workspace-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  background: transparent;
  border-radius: 10px 10px 0 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
}

.workspace-tab::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 2px;
  background: #4285F4;
  border-radius: 1px;
  transition: width 0.25s ease;
}

.workspace-tab:hover {
  color: #334155;
  background: rgba(255, 255, 255, 0.6);
}

.workspace-tab.active {
  color: #4285F4;
  background: #fff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.04);
}

.workspace-tab.active::after {
  width: 60%;
}

.tab-icon {
  font-size: 0.875rem;
  width: 18px;
  text-align: center;
}

.tab-label {
  white-space: nowrap;
}

.workspace-content {
  background: #fff;
  border-radius: 0 12px 12px 12px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 4px 12px rgba(0, 0, 0, 0.03);
  min-height: calc(100vh - 200px);
  overflow: hidden;
}

.tab-panel {
  padding: 1.5rem;
}

.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.tab-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.project-info-view {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.workspace-card {
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.workspace-card :deep(.el-card__header) {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.workspace-card :deep(.el-card__body) {
  padding: 1.5rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
}

.plan-card {
  border-radius: 10px;
}

.plan-card :deep(.el-card__header) {
  padding: 0;
}

.plan-card :deep(.el-card__body) {
  padding: 0;
}

.project-plan-view {
  height: 100%;
}

.split-pane {
  display: flex;
  height: calc(100vh - 280px);
  min-height: 500px;
  overflow: hidden;
}

.split-pane-left {
  flex: 0 0 auto;
  height: 100%;
  overflow: hidden;
  border-right: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.split-pane-left.task-list-hidden {
  width: 0 !important;
  min-width: 0 !important;
  padding: 0;
  overflow: hidden;
  border-right: none;
}

.split-pane-divider {
  width: 6px;
  background: #e5e7eb;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s;
  position: relative;
  z-index: 10;
}

.split-pane-divider:hover {
  background: #4285F4;
}

.split-pane-divider::after {
  content: '⋮⋮';
  color: #666;
  font-size: 12px;
}

.split-pane-divider:hover::after {
  color: #fff;
}

.split-pane-right {
  flex: 1;
  overflow: auto;
  min-width: 0;
}

.upload-demo {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
}

.import-format-info {
  text-align: center;
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.ml-2 {
  margin-left: 8px;
}

.text-primary {
  color: #4285F4;
}

.mr-2 {
  margin-right: 0.5rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.text-4xl {
  font-size: 2.25rem;
}

@media (max-width: 768px) {
  .workspace-header {
    padding: 1.25rem 1rem;
  }

  .workspace-body {
    padding: 0 1rem 1rem;
  }

  .workspace-title {
    font-size: 1.25rem;
  }

  .workspace-subtitle {
    display: none;
  }

  .workspace-tab {
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
  }

  .tab-panel {
    padding: 1rem;
  }

  .split-pane {
    height: calc(100vh - 240px);
  }
}
</style>
