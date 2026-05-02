<template>
  <div class="project-plan-view">
    <el-card>
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

    <el-dialog v-model="importDialogVisible" :title="$t('tasks.plan.import.title')" width="500px">
      <div class="import-format-info">
        <el-tag>{{ getImportFormatLabel(selectedImportFormat) }}</el-tag>
        <span class="ml-2">{{ $t('tasks.plan.import.format') }}</span>
      </div>
      <el-upload
        ref="uploadRef"
        class="upload-demo"
        drag
        :auto-upload="false"
        :on-change="handleFileChange"
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
        <el-button @click="importDialogVisible = false">{{ $t('common.buttons.cancel') }}</el-button>
        <el-button type="primary" @click="handleImportConfirm" :loading="importing">
          {{ $t('tasks.plan.import.buttons.confirmImport') }}
        </el-button>
      </template>
    </el-dialog>
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
import Toolbar from '~/components/ProjectPlan/Toolbar.vue'
import TaskList from '~/components/ProjectPlan/TaskList.vue'
import TaskForm from '~/components/ProjectPlan/TaskForm.vue'
import DisplaySettingsDialog from '~/components/ProjectPlan/DisplaySettingsDialog.vue'
import GanttColumnSettingsDialog from '~/components/ProjectPlan/GanttColumnSettingsDialog.vue'

const { t } = useI18n()
const projectStore = useProjectStore()
const tasksStore = useTasksStore()
const uiStore = useUIStore()

const ganttChartRef = ref(null)
const taskFormVisible = ref(false)
const currentTask = ref(null)
const displaySettingsVisible = ref(false)
const importDialogVisible = ref(false)
const importing = ref(false)
const uploadRef = ref(null)
const selectedFile = ref(null)
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

const taskListData = computed(() => {
  return tasksStore.tasks
})

watch(() => tasksStore.tasks, (newTasks) => {
  console.log('Tasks updated in ProjectPlanView, count:', newTasks?.length || 0)
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

const handleAddRootTask = () => {
  currentTask.value = null
  taskFormVisible.value = true
}

const handleSave = () => {
  tasksStore.saveToLocalStorage()
  ElMessage.success(t('tasks.plan.messages.saved'))
}

const handleImportWithFormat = (format) => {
  importDialogVisible.value = true
  selectedFile.value = null
  selectedImportFormat.value = format
}

const getImportFormatLabel = (format) => {
  return t(`tasks.plan.import.formats.${format}`)
}

const getImportFileAccept = (format) => {
  return t(`tasks.plan.import.accept.${format}`)
}

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

const handleFileChange = (file) => {
  selectedFile.value = file.raw
}

const handleImportConfirm = async () => {
  if (!selectedFile.value) {
    ElMessage.warning(t('tasks.plan.import.messages.selectFile'))
    return
  }

  importing.value = true

  try {
    let result

    switch (selectedImportFormat.value) {
      case 'json':
        result = await importFromJSON(selectedFile.value)
        break
      case 'excel':
        result = await importFromExcel(selectedFile.value)
        break
      case 'markdown':
        result = await importFromMarkdown(selectedFile.value)
        break
      default:
        result = await importFromJSON(selectedFile.value)
    }

    if (result.success) {
      if (result.project) {
        projectStore.importFromJSON(JSON.stringify(result.project))
      }

      if (result.tasks && result.tasks.length > 0) {
        tasksStore.tasks = result.tasks
        tasksStore.generateAndSaveWBS()
        ElMessage.success(t('tasks.plan.import.messages.importSuccess'))
        importDialogVisible.value = false
      } else {
        ElMessage.warning(t('tasks.plan.import.messages.noTasksInFile'))
      }
    } else {
      ElMessage.error(t('tasks.plan.import.messages.importFailed', { error: result.error }))
    }
  } catch (error) {
    ElMessage.error(t('tasks.plan.import.messages.importFailed', { error: error.message }))
  } finally {
    importing.value = false
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
.project-plan-view {
  height: 100%;
}

.split-pane {
  display: flex;
  height: calc(100vh - 260px);
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
</style>
