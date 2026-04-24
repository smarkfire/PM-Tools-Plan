<template>
  <div ref="ganttContainer" class="gantt-container"></div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { gantt } from 'dhtmlx-gantt'
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'
import { flattenTasks } from '@/utils/wbs'

const props = defineProps({
  tasks: {
    type: Array,
    default: () => []
  },
  columnSettings: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['edit-task', 'task-updated', 'delete-task', 'add-child-task', 'reorder-task'])

const ganttContainer = ref(null)
let ganttInitialized = false

// Default column settings
const defaultColumnSettings = {
  wbs: true,
  text: true,
  duration: true,
  start_date: true,
  end_date: true,
  status: true,
  actions: true
}

onMounted(() => {
  initGantt()
})

onBeforeUnmount(() => {
  // Cleanup
  if (ganttInitialized) {
    gantt.clearAll()
  }
})

// Watch for tasks changes
watch(() => props.tasks, (newTasks) => {
  if (ganttInitialized) {
    updateGanttData(newTasks)
  }
}, { deep: true })

// Watch for column settings changes
watch(() => props.columnSettings, () => {
  if (ganttInitialized) {
    // Reconfigure gantt columns
    configureGantt()
    gantt.render()
  }
}, { deep: true })

const initGantt = () => {
  if (!ganttContainer.value) return

  // Configure gantt
  configureGantt()

  // Initialize
  gantt.init(ganttContainer.value)

  // Load initial data
  updateGanttData(props.tasks)

  ganttInitialized = true
}

const configureGantt = () => {
  // Basic configuration
  gantt.config.date_format = '%Y-%m-%d'
  gantt.config.scale_unit = 'day'
  gantt.config.date_scale = '%M %d'
  gantt.config.subscales = []
  gantt.config.scale_height = 50
  gantt.config.row_height = 35
  gantt.config.task_height = 24
  gantt.config.drag_links = true
  gantt.config.drag_progress = false
  gantt.config.drag_resize = true
  gantt.config.drag_move = true
  gantt.config.details_on_create = false
  gantt.config.details_on_dblclick = false

  // Tree structure configuration
  gantt.config.order_branch = true
  gantt.config.order_branch_free = false
  gantt.config.open_tree_initially = false  // Changed to false to preserve state
  gantt.config.task_parent = 'parent'

  // Additional tree settings
  gantt.config.grid_resize = true
  gantt.config.grid_width = 750
  gantt.config.show_links = true
  gantt.config.show_grid = true

  // Fix text display issues
  gantt.config.font_family = "Arial, sans-serif"
  gantt.config.font_size = 13
  gantt.config.rtl = false

  // Merge column settings with defaults
  const settings = { ...defaultColumnSettings, ...props.columnSettings }

  // Define all available columns
  const allColumns = [
    {
      name: 'wbs',
      label: 'WBS',
      width: 150,
      min_width: 150,
      max_width: 250,
      resize: true,
      tree: true,
      align: 'center',
      template: function(obj) {
        return obj.wbs || ''
      }
    },
    {
      name: 'text',
      label: '任务名称',
      width: 200,
      min_width: 200,
      max_width: 400,
      resize: true,
      template: function(obj) {
        return obj.text || ''
      }
    },
    {
      name: 'duration',
      label: '工期',
      width: 60,
      min_width: 50,
      align: 'center',
      resize: true,
      template: function(obj) {
        return obj.duration + '天'
      }
    },
    {
      name: 'start_date',
      label: '开始日期',
      width: 90,
      min_width: 80,
      align: 'center',
      resize: true,
      template: function(obj) {
        return gantt.date.date_to_str('%Y-%m-%d')(obj.start_date)
      }
    },
    {
      name: 'end_date',
      label: '结束日期',
      width: 90,
      min_width: 80,
      align: 'center',
      resize: true,
      template: function(obj) {
        return gantt.date.date_to_str('%Y-%m-%d')(obj.end_date)
      }
    },
    {
      name: 'status',
      label: '状态',
      width: 80,
      min_width: 70,
      align: 'center',
      resize: true,
      template: function(obj) {
        return obj.status || '待办'
      }
    },
    {
      name: 'actions',
      label: '操作',
      width: 280,
      min_width: 200,
      align: 'center',
      resize: true,
      template: function(obj) {
        return `
          <div style="display: flex; gap: 4px; justify-content: center; flex-wrap: wrap;">
            <button class="gantt-action-btn success-btn" onclick="gantt.callEvent('onActionButtonClick', ['add-child', '${obj.id}'])" title="添加子任务">
              <i class="fa fa-plus"></i>
            </button>
            <button class="gantt-action-btn edit-btn" onclick="gantt.callEvent('onActionButtonClick', ['edit', '${obj.id}'])" title="编辑">
              <i class="fa fa-edit"></i>
            </button>
            <button class="gantt-action-btn delete-btn" onclick="gantt.callEvent('onActionButtonClick', ['delete', '${obj.id}'])" title="删除">
              <i class="fa fa-trash"></i>
            </button>
            <button class="gantt-action-btn move-btn" onclick="gantt.callEvent('onActionButtonClick', ['move-up', '${obj.id}'])" title="上移">
              <i class="fa fa-arrow-up"></i>
            </button>
            <button class="gantt-action-btn move-btn" onclick="gantt.callEvent('onActionButtonClick', ['move-down', '${obj.id}'])" title="下移">
              <i class="fa fa-arrow-down"></i>
            </button>
          </div>
        `
      }
    }
  ]

  // Filter columns based on settings
  gantt.config.columns = allColumns.filter(col => settings[col.name])

  // Calculate grid width based on visible columns
  gantt.config.grid_width = gantt.config.columns.reduce((sum, col) => sum + col.width, 0)

  // Task templates
  gantt.templates.task_class = function(start, end, task) {
    return getTaskClass(task)
  }

  gantt.templates.grid_row_class = function(start, end, task) {
    return getTaskRowClass(task)
  }

  gantt.templates.task_row_class = function(start, end, task) {
    return getTaskRowClass(task)
  }

  // Date format templates
  gantt.templates.task_bar_text = function(start, end, task) {
    return `${task.name} (${task.duration}天)`
  }

  gantt.tooltip_template = function(start, end, task) {
    return `
      <div style="padding: 8px;">
        <div style="font-weight: bold; margin-bottom: 4px;">${task.name}</div>
        <div>WBS: ${task.wbs}</div>
        <div>开始: ${gantt.date.date_to_str('%Y-%m-%d')(start)}</div>
        <div>结束: ${gantt.date.date_to_str('%Y-%m-%d')(end)}</div>
        <div>工期: ${task.duration}天</div>
        ${task.assignee ? `<div>负责人: ${task.assignee}</div>` : ''}
        ${task.priority ? `<div>优先级: ${task.priority}</div>` : ''}
        <div>状态: ${task.status || '待办'}</div>
      </div>
    `
  }

  // Scale configuration
  configureScale()

  // Localization with Chinese support
  gantt.i18n.setLocale('cn')

  // Additional text configuration
  gantt.config.font_family = "'Microsoft YaHei', 'Arial', sans-serif"
  gantt.config.font_size = 13

  // Ensure text visibility
  gantt.config.grid_resize = true

  // Add event listeners for task click
  gantt.attachEvent('onTaskClick', function(id, e) {
    // Check if click is on tree expand/collapse button
    const target = e.target
    if (target.classList && (target.classList.contains('gantt_tree_icon') || target.closest('.gantt_tree_icon'))) {
      return true // Allow default expand/collapse behavior without triggering edit
    }

    const task = gantt.getTask(id)
    console.log('Task clicked:', task)

    // Convert parent ID to proper format (0 means no parent)
    const parentId = (task.parent && task.parent !== 0) ? task.parent : null

    // Emit edit event to parent
    // emit('edit-task', {
    //   id: task.id,
    //   wbs: task.wbs,
    //   name: task.text,
    //   startDate: gantt.date.date_to_str('%Y-%m-%d')(task.start_date),
    //   endDate: gantt.date.date_to_str('%Y-%m-%d')(task.end_date),
    //   duration: task.duration,
    //   deliverable: task.deliverable,
    //   dependencies: [],
    //   assignee: task.assignee,
    //   priority: task.priority,
    //   status: task.status,
    //   description: task.description,
    //   parentId: parentId
    // })
    return true // Allow default behavior
  })

  // Also add double-click handler
  gantt.attachEvent('onTaskDblClick', function(id, e) {
    const task = gantt.getTask(id)
    console.log('Task double-clicked:', task)

    // Convert parent ID to proper format (0 means no parent)
    const parentId = (task.parent && task.parent !== 0) ? task.parent : null

    emit('edit-task', {
      id: task.id,
      wbs: task.wbs,
      name: task.text,
      startDate: gantt.date.date_to_str('%Y-%m-%d')(task.start_date),
      endDate: gantt.date.date_to_str('%Y-%m-%d')(task.end_date),
      duration: task.duration,
      deliverable: task.deliverable,
      dependencies: [],
      assignee: task.assignee,
      priority: task.priority,
      status: task.status,
      description: task.description,
      parentId: parentId
    })
    return false // Prevent default behavior (no default dialog)
  })

  // Add task drag end event handler
  gantt.attachEvent('onAfterTaskDrag', function(id, mode, e) {
    const task = gantt.getTask(id)
    console.log('Task dragged:', task, 'Mode:', mode)

    // Convert parent ID to proper format
    const parentId = (task.parent && task.parent !== 0) ? task.parent : null

    // Emit update event to parent
    emit('task-updated', {
      id: task.id,
      wbs: task.wbs,
      name: task.text,
      startDate: gantt.date.date_to_str('%Y-%m-%d')(task.start_date),
      endDate: gantt.date.date_to_str('%Y-%m-%d')(task.end_date),
      duration: task.duration,
      parentId: parentId
    })
  })

  // Add task resize event handler
  gantt.attachEvent('onAfterTaskResize', function(id, item) {
    const task = gantt.getTask(id)
    console.log('Task resized:', task)

    // Convert parent ID to proper format
    const parentId = (task.parent && task.parent !== 0) ? task.parent : null

    // Emit update event to parent
    emit('task-updated', {
      id: task.id,
      wbs: task.wbs,
      name: task.text,
      startDate: gantt.date.date_to_str('%Y-%m-%d')(task.start_date),
      endDate: gantt.date.date_to_str('%Y-%m-%d')(task.end_date),
      duration: task.duration,
      parentId: parentId
    })
  })

  // Add task update event handler (for any other task changes)
  gantt.attachEvent('onAfterTaskUpdate', function(id, item) {
    const task = gantt.getTask(id)
    console.log('Task updated:', task)

    // Convert parent ID to proper format
    const parentId = (task.parent && task.parent !== 0) ? task.parent : null

    // Emit update event to parent
    emit('task-updated', {
      id: task.id,
      wbs: task.wbs,
      name: task.text,
      startDate: gantt.date.date_to_str('%Y-%m-%d')(task.start_date),
      endDate: gantt.date.date_to_str('%Y-%m-%d')(task.end_date),
      duration: task.duration,
      parentId: parentId
    })
  })

  // Add action button click event handler
  gantt.attachEvent('onActionButtonClick', function(action, taskId) {
    const task = gantt.getTask(taskId)
    console.log(`Action ${action} clicked for task:`, task)

    if (action === 'edit') {
      // Convert parent ID to proper format (0 means no parent)
      const parentId = (task.parent && task.parent !== 0) ? task.parent : null

      // Emit edit event to parent
      emit('edit-task', {
        id: task.id,
        wbs: task.wbs,
        name: task.text,
        startDate: gantt.date.date_to_str('%Y-%m-%d')(task.start_date),
        endDate: gantt.date.date_to_str('%Y-%m-%d')(task.end_date),
        duration: task.duration,
        deliverable: task.deliverable,
        dependencies: [],
        assignee: task.assignee,
        priority: task.priority,
        status: task.status,
        description: task.description,
        parentId: parentId
      })
    } else if (action === 'delete') {
      // Emit delete event to parent
      emit('delete-task', task.id)
    } else if (action === 'add-child') {
      // Emit add child task event to parent
      emit('add-child-task', {
        id: task.id,
        name: task.text,
        wbs: task.wbs
      })
    } else if (action === 'move-up') {
      // Emit reorder task event
      emit('reorder-task', task.id, 'up')
    } else if (action === 'move-down') {
      // Emit reorder task event
      emit('reorder-task', task.id, 'down')
    }
  })
}

const configureScale = () => {
  // Configure timeline scale
  const weekScaleTemplate = function(date) {
    const dateToStr = gantt.date.date_to_str('%m/%d')
    return dateToStr(date)
  }

  gantt.config.scales = [
    {
      unit: 'month',
      step: 1,
      format: '%Y年 %m'
    },
    {
      unit: 'day',
      step: 1,
      format: weekScaleTemplate
    }
  ]
}

const updateGanttData = (tasks) => {
  if (!tasks || tasks.length === 0) {
    gantt.clearAll()
    return
  }

  // Save current expand/collapse state before updating
  const savedOpenState = {}
  if (ganttInitialized) {
    gantt.eachTask((task) => {
      savedOpenState[task.id] = task.$open
    })
  }

  // Convert tasks to gantt format
  const ganttTasks = convertToGanttFormat(tasks)
  const ganttLinks = extractLinks(tasks)

  // Debug: log the converted data
  console.log('Original tasks structure:', tasks)
  console.log('Converted gantt tasks:', ganttTasks)
  console.log('Gantt links:', ganttLinks)

  // Clear and parse data
  gantt.clearAll()

  // Parse with explicit configuration
  gantt.parse({
    data: ganttTasks,
    links: ganttLinks
  })

  // Restore expand/collapse state after updating
  if (ganttInitialized && Object.keys(savedOpenState).length > 0) {
    gantt.eachTask((task) => {
      if (savedOpenState.hasOwnProperty(task.id)) {
        gantt.close(task.id)
        task.$open = savedOpenState[task.id]
        if (savedOpenState[task.id]) {
          gantt.open(task.id)
        }
      }
    })
  }

  // Force re-render
  gantt.render()

  // Debug: check parsed data
  console.log('Gantt internal data:', gantt.getTaskByTime())
}

/**
 * Convert nested task structure to gantt format with proper parent references
 */
const convertToGanttFormat = (tasks) => {
  const result = []

  /**
   * Recursively process tasks and their children
   */
  const processTasks = (taskList, parentId = 0) => {
    if (!Array.isArray(taskList)) return

    taskList.forEach((task, index) => {
      console.log(`[${index}] Processing: "${task.name}" (ID: ${task.id}, Setting parent: ${parentId})`)

      // Ensure ID is a string
      const taskId = String(task.id)

      // Create gantt task object
      const ganttTask = {
        id: taskId,
        text: String(task.name || ''),
        start_date: task.startDate || new Date(),
        end_date: task.endDate || new Date(),
        duration: Number(task.duration) || 1,
        wbs: String(task.wbs || ''),
        parent: parentId, // 0 for root, or parent task ID
        priority: String(task.priority || '中'),
        status: String(task.status || '待办'),
        assignee: String(task.assignee || ''),
        description: String(task.description || ''),
        deliverable: String(task.deliverable || ''),
        type: 'task',
        open: true,
        $open: true // Force open state
      }

      result.push(ganttTask)

      // Process children recursively
      if (task.children && Array.isArray(task.children) && task.children.length > 0) {
        console.log(`  → "${task.name}" has ${task.children.length} children`)
        processTasks(task.children, taskId)
      }
    })
  }

  console.log(`=== Converting ${tasks.length} root tasks ===`)
  processTasks(tasks, 0)

  console.log(`=== Total converted: ${result.length} tasks ===`)
  return result
}

const extractLinks = (tasks) => {
  const flatTasks = flattenTasks(tasks)
  const links = []
  let linkId = 1

  flatTasks.forEach(task => {
    if (task.dependencies && Array.isArray(task.dependencies)) {
      task.dependencies.forEach(depId => {
        links.push({
          id: String(linkId++),
          source: depId,
          target: task.id,
          type: '0' // Finish to Start
        })
      })
    }
  })

  return links
}

const getTaskClass = (task) => {
  let classes = []

  if (task.priority === '高') {
    classes.push('gantt-task-high')
  } else if (task.priority === '中') {
    classes.push('gantt-task-medium')
  } else if (task.priority === '低') {
    classes.push('gantt-task-low')
  }

  // Add status-based classes for progress bar colors
  if (task.status === '已完成') {
    classes.push('gantt-task-completed')
  } else if (task.status === '进行中') {
    classes.push('gantt-task-in-progress')
  } else if (task.status === '待办') {
    classes.push('gantt-task-pending')
  } else if (task.status === '已暂停') {
    classes.push('gantt-task-paused')
  }

  return classes.join(' ')
}

const getTaskRowClass = (task) => {
  let classes = []

  if (task.status === '已完成') {
    classes.push('gantt-row-completed')
  }

  return classes.join(' ')
}

const exportToPNG = () => {
  return new Promise((resolve, reject) => {
    try {
      // Export the gantt chart as PNG
      gantt.exportToPNG({
        name: `gantt-chart-${Date.now()}.png`,
        header: '<div style="padding: 10px; font-size: 16px; font-weight: bold;">项目甘特图</div>'
      })
      resolve(true)
    } catch (error) {
      // If exportToPNG is not available (requires license), fallback to html2canvas
      try {
        import('html2canvas').then(({ default: html2canvas }) => {
          if (ganttContainer.value) {
            html2canvas(ganttContainer.value, {
              backgroundColor: '#ffffff',
              scale: 2,
              logging: false
            }).then(canvas => {
              canvas.toBlob(blob => {
                if (blob) {
                  downloadBlob(blob, `gantt-chart-${Date.now()}.png`)
                  resolve(true)
                } else {
                  reject(new Error('Failed to create blob'))
                }
              }, 'image/png')
            }).catch(error => reject(error))
          } else {
            reject(new Error('Gantt container not found'))
          }
        }).catch(() => {
          reject(new Error('html2canvas not available'))
        })
      } catch (error) {
        reject(error)
      }
    }
  })
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

// Expose export method
defineExpose({
  exportToPNG
})
</script>

<style scoped>
.gantt-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
}

/* 列分割线样式 */
:deep(.gantt_grid_head_cell) {
  border-right: 1px solid #e0e0e0;
}

:deep(.gantt_grid_row_cell) {
  border-right: 1px solid #e0e0e0;
}

/* 调整列宽度时的样式 */
:deep(.gantt_resize_handle) {
  cursor: col-resize;
}

/* 操作按钮样式 */
:deep(.gantt-action-btn) {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

:deep(.gantt-action-btn:hover) {
  opacity: 0.8;
  transform: translateY(-1px);
}

:deep(.success-btn) {
  background-color: #4caf50;
  color: white;
  border-color: #4caf50;
}

:deep(.edit-btn) {
  background-color: #2196f3;
  color: white;
  border-color: #2196f3;
}

:deep(.delete-btn) {
  background-color: #f44336;
  color: white;
  border-color: #f44336;
}

:deep(.move-btn) {
  background-color: #ff9800;
  color: white;
  border-color: #ff9800;
}

/* 状态-based进度条颜色 */
:deep(.gantt-task-pending .gantt_task_progress) {
  background-color: #9e9e9e;
}

:deep(.gantt-task-in-progress .gantt_task_progress) {
  background-color: #2196f3;
}

:deep(.gantt-task-completed .gantt_task_progress) {
  background-color: #4caf50;
}

:deep(.gantt-task-paused .gantt_task_progress) {
  background-color: #ff9800;
}

/* 任务条本身的颜色 */
:deep(.gantt-task-pending) {
  background-color: #f5f5f5;
  border-color: #e0e0e0;
}

:deep(.gantt-task-in-progress) {
  background-color: #bbdefb;
  border-color: #2196f3;
}

:deep(.gantt-task-completed) {
  background-color: #c8e6c9;
  border-color: #4caf50;
}

:deep(.gantt-task-paused) {
  background-color: #ffe0b2;
  border-color: #ff9800;
}
</style>
