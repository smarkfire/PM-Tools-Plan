<template>
  <div ref="ganttContainer" class="gantt-container"></div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { gantt } from 'dhtmlx-gantt'
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'
import { flattenTasks } from '~/utils/wbs'

const { t, locale } = useI18n()

const props = defineProps({
  tasks: {
    type: Array,
    default: () => []
  },
  columnSettings: {
    type: Object,
    default: () => ({})
  },
  colorScheme: {
    type: Object,
    default: () => ({ mode: 'status', name: 'classic' })
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
  priority: true,
  assignee: true,
  deliverable: true,
  dependencies: true,
  status: true,
  description: false, // Description is hidden by default as it's long
  actions: true
}

// Translation helper functions
const getLabel = (key) => {
  const labels = {
    wbs: 'gantt.columns.wbs',
    text: 'gantt.columns.name',
    duration: 'gantt.columns.duration',
    start_date: 'gantt.columns.startDate',
    end_date: 'gantt.columns.endDate',
    priority: 'gantt.columns.priority',
    assignee: 'gantt.columns.assignee',
    deliverable: 'gantt.columns.deliverable',
    dependencies: 'gantt.columns.dependencies',
    status: 'gantt.columns.status',
    description: 'gantt.columns.description',
    actions: 'gantt.columns.actions'
  }
  return t(labels[key] || key)
}

const getTooltipText = (key) => {
  const tooltips = {
    addChild: 'gantt.actions.addChild',
    edit: 'gantt.actions.edit',
    delete: 'gantt.actions.delete',
    moveUp: 'gantt.actions.moveUp',
    moveDown: 'gantt.actions.moveDown'
  }
  return t(tooltips[key] || key)
}

// Computed property for gantt locale
const ganttLocale = computed(() => {
  return locale.value === 'zh-CN' ? 'cn' : 'en'
})

onMounted(() => {
  initGantt()
})

onBeforeUnmount(() => {
  // Cleanup
  if (ganttInitialized) {
    gantt.clearAll()
  }
})

// Watch for locale changes
watch(locale, () => {
  if (ganttInitialized) {
    configureGantt()
    gantt.render()
  }
})

// Watch for color scheme changes
watch(() => props.colorScheme, () => {
  if (ganttInitialized) {
    applyColorScheme()
    gantt.render()
  }
}, { deep: true })

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

  // Apply color scheme
  applyColorScheme()

  // Load initial data
  updateGanttData(props.tasks)

  ganttInitialized = true
}

const colorSchemes = {
  classic: {
    status: {
      pending: { bg: '#f5f5f5', border: '#e0e0e0', progress: '#9e9e9e', text: '#333333' },
      inProgress: { bg: '#bbdefb', border: '#2196f3', progress: '#2196f3', text: '#333333' },
      completed: { bg: '#c8e6c9', border: '#4caf50', progress: '#4caf50', text: '#333333' },
      paused: { bg: '#ffe0b2', border: '#ff9800', progress: '#ff9800', text: '#333333' }
    },
    priority: {
      high: { bg: '#ef9a9a', border: '#e53935', progress: '#e53935', text: '#333333' },
      medium: { bg: '#bbdefb', border: '#2196f3', progress: '#2196f3', text: '#333333' },
      low: { bg: '#e0e0e0', border: '#9e9e9e', progress: '#9e9e9e', text: '#333333' }
    }
  },
  ocean: {
    status: {
      pending: { bg: '#e0f2f1', border: '#80cbc4', progress: '#80cbc4', text: '#ffffff' },
      inProgress: { bg: '#4db6ac', border: '#26a69a', progress: '#26a69a', text: '#ffffff' },
      completed: { bg: '#00897b', border: '#00796b', progress: '#00796b', text: '#ffffff' },
      paused: { bg: '#90a4ae', border: '#78909c', progress: '#78909c', text: '#ffffff' }
    },
    priority: {
      high: { bg: '#ff8a80', border: '#ff5252', progress: '#ff5252', text: '#ffffff' },
      medium: { bg: '#4db6ac', border: '#26a69a', progress: '#26a69a', text: '#ffffff' },
      low: { bg: '#b0bec5', border: '#90a4ae', progress: '#90a4ae', text: '#ffffff' }
    }
  },
  warm: {
    status: {
      pending: { bg: '#fff8e1', border: '#ffcc80', progress: '#ffcc80', text: '#333333' },
      inProgress: { bg: '#ffcc80', border: '#ffa726', progress: '#ffa726', text: '#333333' },
      completed: { bg: '#ef9a9a', border: '#ef5350', progress: '#ef5350', text: '#333333' },
      paused: { bg: '#f48fb1', border: '#ec407a', progress: '#ec407a', text: '#ffffff' }
    },
    priority: {
      high: { bg: '#ef5350', border: '#d32f2f', progress: '#d32f2f', text: '#ffffff' },
      medium: { bg: '#ffcc80', border: '#ffa726', progress: '#ffa726', text: '#333333' },
      low: { bg: '#ffe0b2', border: '#ffcc80', progress: '#ffcc80', text: '#333333' }
    }
  },
  forest: {
    status: {
      pending: { bg: '#e8f5e9', border: '#a5d6a7', progress: '#a5d6a7', text: '#ffffff' },
      inProgress: { bg: '#66bb6a', border: '#43a047', progress: '#43a047', text: '#ffffff' },
      completed: { bg: '#2e7d32', border: '#1b5e20', progress: '#1b5e20', text: '#ffffff' },
      paused: { bg: '#a1887f', border: '#8d6e63', progress: '#8d6e63', text: '#ffffff' }
    },
    priority: {
      high: { bg: '#d32f2f', border: '#b71c1c', progress: '#b71c1c', text: '#ffffff' },
      medium: { bg: '#66bb6a', border: '#43a047', progress: '#43a047', text: '#ffffff' },
      low: { bg: '#a5d6a7', border: '#81c784', progress: '#81c784', text: '#333333' }
    }
  },
  neon: {
    status: {
      pending: { bg: '#311b92', border: '#4527a0', progress: '#7c4dff', text: '#ffffff' },
      inProgress: { bg: '#2979ff', border: '#2962ff', progress: '#448aff', text: '#ffffff' },
      completed: { bg: '#00e676', border: '#00c853', progress: '#69f0ae', text: '#1a1a2e' },
      paused: { bg: '#d500f9', border: '#aa00ff', progress: '#ea80fc', text: '#ffffff' }
    },
    priority: {
      high: { bg: '#ff1744', border: '#d50000', progress: '#ff5252', text: '#ffffff' },
      medium: { bg: '#2979ff', border: '#2962ff', progress: '#448aff', text: '#ffffff' },
      low: { bg: '#7c4dff', border: '#651fff', progress: '#b388ff', text: '#ffffff' }
    }
  }
}

const applyColorScheme = () => {
  const schemeName = props.colorScheme.name || 'classic'
  const mode = props.colorScheme.mode || 'status'
  const scheme = colorSchemes[schemeName]
  if (!scheme) return

  const colors = scheme[mode]

  const container = ganttContainer.value
  if (!container) return

  const styleId = 'gantt-color-scheme-override'
  let styleEl = document.getElementById(styleId)
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = styleId
    document.head.appendChild(styleEl)
  }

  let css = ''

  if (mode === 'status') {
    css += `
      .gantt_task_line.gantt-task-pending {
        --dhx-gantt-task-background: ${colors.pending.bg};
        --dhx-gantt-task-color: ${colors.pending.text};
        border-color: ${colors.pending.border} !important;
      }
      .gantt_task_line.gantt-task-pending .gantt_task_progress {
        background-color: ${colors.pending.progress} !important;
        opacity: 0.3;
      }
      .gantt_task_line.gantt-task-in-progress {
        --dhx-gantt-task-background: ${colors.inProgress.bg};
        --dhx-gantt-task-color: ${colors.inProgress.text};
        border-color: ${colors.inProgress.border} !important;
      }
      .gantt_task_line.gantt-task-in-progress .gantt_task_progress {
        background-color: ${colors.inProgress.progress} !important;
        opacity: 0.4;
      }
      .gantt_task_line.gantt-task-completed {
        --dhx-gantt-task-background: ${colors.completed.bg};
        --dhx-gantt-task-color: ${colors.completed.text};
        border-color: ${colors.completed.border} !important;
      }
      .gantt_task_line.gantt-task-completed .gantt_task_progress {
        background-color: ${colors.completed.progress} !important;
        opacity: 0.3;
      }
      .gantt_task_line.gantt-task-paused {
        --dhx-gantt-task-background: ${colors.paused.bg};
        --dhx-gantt-task-color: ${colors.paused.text};
        border-color: ${colors.paused.border} !important;
      }
      .gantt_task_line.gantt-task-paused .gantt_task_progress {
        background-color: ${colors.paused.progress} !important;
        opacity: 0.3;
      }
    `
  } else {
    css += `
      .gantt_task_line.gantt-task-high {
        --dhx-gantt-task-background: ${colors.high.bg};
        --dhx-gantt-task-color: ${colors.high.text};
        border-color: ${colors.high.border} !important;
      }
      .gantt_task_line.gantt-task-high .gantt_task_progress {
        background-color: ${colors.high.progress} !important;
        opacity: 0.4;
      }
      .gantt_task_line.gantt-task-medium {
        --dhx-gantt-task-background: ${colors.medium.bg};
        --dhx-gantt-task-color: ${colors.medium.text};
        border-color: ${colors.medium.border} !important;
      }
      .gantt_task_line.gantt-task-medium .gantt_task_progress {
        background-color: ${colors.medium.progress} !important;
        opacity: 0.4;
      }
      .gantt_task_line.gantt-task-low {
        --dhx-gantt-task-background: ${colors.low.bg};
        --dhx-gantt-task-color: ${colors.low.text};
        border-color: ${colors.low.border} !important;
      }
      .gantt_task_line.gantt-task-low .gantt_task_progress {
        background-color: ${colors.low.progress} !important;
        opacity: 0.3;
      }
    `
  }

  styleEl.textContent = css
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
      label: getLabel('wbs'),
      width: 120,
      min_width: 100,
      max_width: 200,
      resize: true,
      tree: true,
      align: 'center',
      template: function(obj) {
        return obj.wbs || ''
      }
    },
    {
      name: 'text',
      label: getLabel('text'),
      width: 200,
      min_width: 150,
      max_width: 400,
      resize: true,
      template: function(obj) {
        return obj.text || ''
      }
    },
    {
      name: 'duration',
      label: getLabel('duration'),
      width: 60,
      min_width: 50,
      align: 'center',
      resize: true,
      template: function(obj) {
        return obj.duration + t('gantt.days')
      }
    },
    {
      name: 'start_date',
      label: getLabel('start_date'),
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
      label: getLabel('end_date'),
      width: 90,
      min_width: 80,
      align: 'center',
      resize: true,
      template: function(obj) {
        return gantt.date.date_to_str('%Y-%m-%d')(obj.end_date)
      }
    },
    {
      name: 'priority',
      label: getLabel('priority'),
      width: 70,
      min_width: 60,
      align: 'center',
      resize: true,
      template: function(obj) {
        const priority = obj.priority || t('common.priority.medium')
        return priority
      }
    },
    {
      name: 'assignee',
      label: getLabel('assignee'),
      width: 100,
      min_width: 80,
      resize: true,
      template: function(obj) {
        return obj.assignee || ''
      }
    },
    {
      name: 'deliverable',
      label: getLabel('deliverable'),
      width: 150,
      min_width: 100,
      resize: true,
      template: function(obj) {
        return obj.deliverable || ''
      }
    },
    {
      name: 'dependencies',
      label: getLabel('dependencies'),
      width: 120,
      min_width: 100,
      resize: true,
      template: function(obj) {
        return (obj.dependencies || []).join(', ')
      }
    },
    {
      name: 'status',
      label: getLabel('status'),
      width: 80,
      min_width: 70,
      align: 'center',
      resize: true,
      template: function(obj) {
        return obj.status || t('common.status.todo')
      }
    },
    {
      name: 'description',
      label: getLabel('description'),
      width: 150,
      min_width: 100,
      resize: true,
      template: function(obj) {
        return obj.description || ''
      }
    },
    {
      name: 'actions',
      label: getLabel('actions'),
      width: 200,
      min_width: 180,
      align: 'center',
      resize: false,
      template: function(obj) {
        return `
          <div style="display: flex; gap: 4px; justify-content: center; flex-wrap: wrap;">
            <button class="gantt-action-btn success-btn" onclick="gantt.callEvent('onActionButtonClick', ['add-child', '${obj.id}'])" title="${getTooltipText('addChild')}">
              <i class="fa fa-plus"></i>
            </button>
            <button class="gantt-action-btn edit-btn" onclick="gantt.callEvent('onActionButtonClick', ['edit', '${obj.id}'])" title="${getTooltipText('edit')}">
              <i class="fa fa-edit"></i>
            </button>
            <button class="gantt-action-btn delete-btn" onclick="gantt.callEvent('onActionButtonClick', ['delete', '${obj.id}'])" title="${getTooltipText('delete')}">
              <i class="fa fa-trash"></i>
            </button>
            <button class="gantt-action-btn move-btn" onclick="gantt.callEvent('onActionButtonClick', ['move-up', '${obj.id}'])" title="${getTooltipText('moveUp')}">
              <i class="fa fa-arrow-up"></i>
            </button>
            <button class="gantt-action-btn move-btn" onclick="gantt.callEvent('onActionButtonClick', ['move-down', '${obj.id}'])" title="${getTooltipText('moveDown')}">
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
    return `${task.name} (${task.duration}${t('gantt.days')})`
  }

  gantt.tooltip_template = function(start, end, task) {
    return `
      <div style="padding: 8px;">
        <div style="font-weight: bold; margin-bottom: 4px;">${task.name}</div>
        <div>WBS: ${task.wbs}</div>
        <div>${t('gantt.startDate')}: ${gantt.date.date_to_str('%Y-%m-%d')(start)}</div>
        <div>${t('gantt.endDate')}: ${gantt.date.date_to_str('%Y-%m-%d')(end)}</div>
        <div>${t('gantt.duration')}: ${task.duration}${t('gantt.days')}</div>
        ${task.assignee ? `<div>${t('tasks.form.fields.assignee')}: ${task.assignee}</div>` : ''}
        ${task.priority ? `<div>${t('tasks.form.fields.priority')}: ${task.priority}</div>` : ''}
        <div>${t('tasks.form.fields.status')}: ${task.status || t('common.status.todo')}</div>
      </div>
    `
  }

  // Scale configuration
  configureScale()

  // Localization with dynamic locale support
  gantt.i18n.setLocale(ganttLocale.value)

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

  const monthFormat = locale.value === 'zh-CN' ? '%Y年 %m' : '%Y %m'

  gantt.config.scales = [
    {
      unit: 'month',
      step: 1,
      format: monthFormat
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
        priority: String(task.priority || t('common.priority.medium')),
        status: String(task.status || t('common.status.todo')),
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

  const priority = task.priority
  if (priority === t('common.priority.high') || priority === '高' || priority === 'High') {
    classes.push('gantt-task-high')
  } else if (priority === t('common.priority.medium') || priority === '中' || priority === 'Medium') {
    classes.push('gantt-task-medium')
  } else if (priority === t('common.priority.low') || priority === '低' || priority === 'Low') {
    classes.push('gantt-task-low')
  }

  // Add status-based classes for progress bar colors
  const status = task.status
  const completedStatus = t('common.status.completed')
  const inProgressStatus = t('common.status.inProgress')
  const todoStatus = t('common.status.todo')

  if (status === completedStatus || status === '已完成' || status === 'Completed') {
    classes.push('gantt-task-completed')
  } else if (status === inProgressStatus || status === '进行中' || status === 'In Progress') {
    classes.push('gantt-task-in-progress')
  } else if (status === todoStatus || status === '待办' || status === 'To Do') {
    classes.push('gantt-task-pending')
  } else if (status === '已暂停' || status === 'Paused') {
    classes.push('gantt-task-paused')
  }

  return classes.join(' ')
}

const getTaskRowClass = (task) => {
  let classes = []

  const status = task.status
  if (status === t('common.status.completed') || status === '已完成' || status === 'Completed') {
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
        header: `<div style="padding: 10px; font-size: 16px; font-weight: bold;">${t('gantt.title')}</div>`
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
</style>
