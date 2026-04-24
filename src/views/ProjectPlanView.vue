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

      <!-- Split Pane -->
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
          <GanttChart
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
        </div>
      </div>
    </el-card>

    <!-- Task Form Dialog -->
    <TaskForm
      v-model:visible="taskFormVisible"
      :task="currentTask"
      :members="projectStore.memberOptions"
      :all-tasks="tasksStore.flatTaskList"
      @save="handleSaveTask"
    />

    <!-- Display Settings Dialog -->
    <DisplaySettingsDialog
      v-model:visible="displaySettingsVisible"
      :settings="tasksStore.displaySettings"
      @save="handleSaveDisplaySettings"
    />

    <!-- Gantt Column Settings Dialog -->
    <GanttColumnSettingsDialog
      v-model:visible="ganttColumnSettingsVisible"
      :settings="ganttColumnSettings"
      @save="handleSaveGanttColumnSettings"
    />

    <!-- Import Dialog -->
    <el-dialog v-model="importDialogVisible" title="导入项目计划" width="500px">
      <div class="import-format-info">
        <el-tag>{{ getImportFormatLabel(selectedImportFormat) }}</el-tag>
        <span class="ml-2">格式</span>
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
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            {{ getImportFileTip(selectedImportFormat) }}
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useProjectStore } from '@/store/project'
import { useTasksStore } from '@/store/tasks'
import { useUIStore } from '@/store/ui'
import { importFromJSON, importFromExcel, importFromMarkdown } from '@/utils/import'
import { exportProjectData } from '@/utils/export'
import { loadEnhancedMockData, clearAllData } from '@/utils/mockHelper'
import Toolbar from '@/components/ProjectPlan/Toolbar.vue'
import TaskList from '@/components/ProjectPlan/TaskList.vue'
import GanttChart from '@/components/GanttChart/GanttChart.vue'
import TaskForm from '@/components/ProjectPlan/TaskForm.vue'
import DisplaySettingsDialog from '@/components/ProjectPlan/DisplaySettingsDialog.vue'
import GanttColumnSettingsDialog from '@/components/ProjectPlan/GanttColumnSettingsDialog.vue'

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
const showTaskList = ref(true)
const ganttColumnSettingsVisible = ref(false)
const ganttColumnSettings = ref({
  wbs: true,
  text: true,
  duration: true,
  start_date: true,
  end_date: true,
  status: true,
  actions: true
})

// Computed property to ensure reactivity for task list
const taskListData = computed(() => {
  return tasksStore.tasks
})

// Watch task changes for debugging
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

// Toolbar actions
const handleAddRootTask = () => {
  currentTask.value = null
  taskFormVisible.value = true
}

const handleSave = () => {
  tasksStore.saveToLocalStorage()
  ElMessage.success('项目计划保存成功')
}

const handleImport = () => {
  importDialogVisible.value = true
  selectedFile.value = null
}

const handleImportWithFormat = (format) => {
  importDialogVisible.value = true
  selectedFile.value = null
  selectedImportFormat.value = format
}

// Helper functions for import format
const getImportFormatLabel = (format) => {
  const labels = {
    'json': 'JSON',
    'excel': 'Excel',
    'markdown': 'Markdown'
  }
  return labels[format] || format
}

const getImportFileAccept = (format) => {
  const accepts = {
    'json': '.json',
    'excel': '.xlsx,.xls',
    'markdown': '.md'
  }
  return accepts[format] || '.json,.xlsx,.xls,.md'
}

const getImportFileTip = (format) => {
  const tips = {
    'json': '请选择 JSON 格式文件',
    'excel': '请选择 Excel 文件 (.xlsx 或 .xls)',
    'markdown': '请选择 Markdown 文件'
  }
  return tips[format] || '支持 JSON、Excel 和 Markdown 格式'
}

const handleExportWithFormat = (format) => {
  try {
    const success = exportProjectData(
      projectStore.project,
      tasksStore.tasks,
      format,
      `project-plan-${Date.now()}`
    )
    if (success) {
      ElMessage.success('导出成功')
    } else {
      ElMessage.error('导出失败')
    }
  } catch (error) {
    ElMessage.error(`导出失败: ${error.message}`)
  }
}

const handleExportGantt = () => {
  if (ganttChartRef.value && ganttChartRef.value.exportToPNG) {
    ganttChartRef.value.exportToPNG().then(() => {
      ElMessage.success('甘特图导出成功')
    }).catch((error) => {
      ElMessage.error(`导出失败: ${error.message}`)
    })
  } else {
    ElMessage.warning('甘特图导出功能暂不可用')
  }
}

const handleToggleExpand = () => {
  const allExpanded = Array.from(tasksStore.expandedTasks).length === tasksStore.flatTaskList.length
  if (allExpanded) {
    tasksStore.collapseAll()
    ElMessage.info('已全部折叠')
  } else {
    tasksStore.expandAll()
    ElMessage.info('已全部展开')
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
  ElMessage.success('甘特图列设置已保存')
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
    '加载演示数据将覆盖当前所有数据，确定要继续吗？',
    '确认加载',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const success = loadEnhancedMockData()
    if (success) {
      // Reload stores from localStorage
      projectStore.loadFromLocalStorage()
      tasksStore.loadFromLocalStorage()
      uiStore.loadFromLocalStorage()
      ElMessage.success('演示数据加载成功！')
    } else {
      ElMessage.error('加载演示数据失败')
    }
  }).catch(() => {
    // User cancelled
  })
}

const handleClearAllData = () => {
  ElMessageBox.confirm(
    '此操作将清除所有项目数据且无法恢复，确定要继续吗？',
    '确认清除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    }
  ).then(() => {
    const success = clearAllData()
    if (success) {
      // Clear stores
      projectStore.clearProject()
      tasksStore.clearTasks()
      // Reset UI store to default values
      uiStore.splitRatio = 0.4
      uiStore.isSplitPaneDragging = false
      localStorage.removeItem('plan-tools-ui')
      ElMessage.success('所有数据已清除！')
    } else {
      ElMessage.error('清除数据失败')
    }
  }).catch(() => {
    // User cancelled
  })
}

const handleToggleTaskListVisibility = () => {
  showTaskList.value = !showTaskList.value
}

// Task list actions
const handleEditTask = (task) => {
  currentTask.value = { ...task }
  taskFormVisible.value = true
}

// Handle edit task from Gantt chart
const handleEditTaskFromGantt = (task) => {
  console.log('Received edit task from Gantt:', task)
  // Find the full task data from store to get all fields including parentId
  const fullTask = tasksStore.taskById(task.id)
  if (fullTask) {
    // Merge data from gantt with full task data
    currentTask.value = {
      ...fullTask,
      ...task // Override with gantt data
    }
  } else {
    currentTask.value = { ...task }
  }
  taskFormVisible.value = true
}

// Handle task updated from Gantt chart (after drag/resize)
const handleTaskUpdatedFromGantt = (taskData) => {
  console.log('Received task update from Gantt:', taskData)

  // Update the task in store with new dates and duration
  tasksStore.updateTask(taskData.id, {
    startDate: taskData.startDate,
    endDate: taskData.endDate,
    duration: taskData.duration
  })

  // Show success message
  ElMessage.success('任务已更新')
}

// Handle add child task from Gantt chart
const handleAddChildTaskFromGantt = (parentTask) => {
  console.log('Received add child task from Gantt:', parentTask)
  currentTask.value = {
    parentId: parentTask.id,
    parentName: parentTask.name
  }
  taskFormVisible.value = true
}

// Handle delete task from Gantt chart
const handleDeleteTaskFromGantt = (taskId) => {
  console.log('Received delete task from Gantt:', taskId)
  tasksStore.deleteTask(taskId)
  ElMessage.success('任务删除成功')
}

const handleDeleteTask = (task) => {
  tasksStore.deleteTask(task.id)
  ElMessage.success('任务删除成功')
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

// Task form actions
const handleSaveTask = (taskData) => {
  if (currentTask.value && currentTask.value.id) {
    // Update existing task
    tasksStore.updateTask(currentTask.value.id, taskData)
    ElMessage.success('任务更新成功')
    taskFormVisible.value = false
  } else {
    // Add new task
    try {
      tasksStore.addTask({
        ...taskData,
        parentId: taskData.parentId || null
      })
      ElMessage.success('任务添加成功')
      taskFormVisible.value = false
    } catch (error) {
      ElMessage.error(error.message || '任务添加失败')
    }
  }
}

// Display settings
const handleSaveDisplaySettings = (settings) => {
  tasksStore.updateDisplaySettings(settings)
  ElMessage.success('显示设置已保存')
}

// Import handling
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
    let result

    // Use specific import function based on selected format
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
      // Import project data if available
      if (result.project) {
        projectStore.importFromJSON(JSON.stringify(result.project))
      }

      // Import tasks
      if (result.tasks && result.tasks.length > 0) {
        tasksStore.tasks = result.tasks
        // Regenerate WBS after import
        tasksStore.generateAndSaveWBS()
        ElMessage.success('项目计划导入成功')
        importDialogVisible.value = false
      } else {
        ElMessage.warning('导入文件中没有找到任务数据')
      }
    } else {
      ElMessage.error(`导入失败: ${result.error}`)
    }
  } catch (error) {
    ElMessage.error(`导入失败: ${error.message}`)
  } finally {
    importing.value = false
  }
}

// Split pane dragging
const handleDividerMouseDown = (e) => {
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
