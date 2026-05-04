<template>
  <div ref="ganttContainer" class="share-gantt-chart"></div>
</template>

<script setup>
import { gantt } from 'dhtmlx-gantt'
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  visibleColumns: { type: Object, default: () => ({}) },
})

const { t, locale } = useI18n()
const ganttContainer = ref(null)

const allColumns = [
  { key: 'wbs', name: 'wbs', label: 'WBS', width: 60 },
  { key: 'name', name: 'text', label: () => t('share.taskName'), tree: true, width: 200 },
  { key: 'startDate', name: 'start_date', label: () => t('share.startDate'), align: 'center', width: 90 },
  { key: 'duration', name: 'duration', label: () => t('share.duration'), align: 'center', width: 70 },
  { key: 'assignee', name: 'assignee', label: () => t('share.assignee'), align: 'center', width: 80, template: (obj) => obj.assignee || '' },
  { key: 'status', name: 'status', label: () => t('share.status'), align: 'center', width: 80, template: (obj) => obj.status || '' },
  { key: 'milestone', name: 'milestone', label: () => t('share.milestone'), align: 'center', width: 70, template: (obj) => obj.milestone ? '★' : '' },
]

function getColumns() {
  return allColumns
    .filter(col => props.visibleColumns[col.key] !== false)
    .map(col => {
      const base = {
        name: col.name,
        label: typeof col.label === 'function' ? col.label() : col.label,
        width: col.width,
      }
      if (col.tree) base.tree = true
      if (col.align) base.align = col.align
      if (col.template) base.template = col.template
      return base
    })
}

function initGantt() {
  if (!ganttContainer.value) return

  gantt.config.readonly = true
  gantt.config.drag_move = false
  gantt.config.drag_resize = false
  gantt.config.drag_progress = false
  gantt.config.drag_links = false
  gantt.config.edit_on_click = false
  gantt.config.show_task_cells = true
  gantt.config.date_format = '%Y-%m-%d'
  gantt.config.scale_unit = 'day'
  gantt.config.min_column_width = 40
  gantt.config.row_height = 36
  gantt.config.bar_height = 24
  gantt.config.auto_scheduling = false
  gantt.config.fit_tasks = true
  gantt.config.columns = getColumns()

  gantt.init(ganttContainer.value)
  loadTasks()
}

function loadTasks() {
  if (props.tasks && props.tasks.length > 0) {
    const taskMap = new Map()
    const ganttTasks = props.tasks.map((task) => {
      const ganttTask = {
        id: task.id,
        text: task.name || 'Untitled',
        start_date: task.startDate ? new Date(task.startDate) : new Date(),
        duration: task.duration || 1,
        progress: 0,
        parent: task.parentId || 0,
        milestone: task.isMilestone || false,
        wbs: task.wbs || '',
        assignee: task.assignee || '',
        status: task.status || '',
      }
      taskMap.set(task.id, ganttTask)
      return ganttTask
    })

    const ganttLinks = []
    props.tasks.forEach((task) => {
      if (task.dependencies && Array.isArray(task.dependencies)) {
        task.dependencies.forEach((depId) => {
          if (taskMap.has(depId)) {
            ganttLinks.push({
              id: `link-${task.id}-${depId}`,
              source: depId,
              target: task.id,
              type: '0',
            })
          }
        })
      }
    })

    gantt.parse({ data: ganttTasks, links: ganttLinks })
  } else {
    gantt.clearAll()
  }
}

onMounted(() => {
  initGantt()
})

function refreshGantt() {
  if (ganttContainer.value && ganttInitialized()) {
    gantt.config.columns = getColumns()
    gantt.render()
  }
}

function ganttInitialized() {
  try {
    return !!gantt.$root
  } catch {
    return false
  }
}

watch(locale, () => refreshGantt())
watch(() => props.visibleColumns, () => refreshGantt(), { deep: true })
</script>

<style scoped>
.share-gantt-chart {
  width: 100%;
  height: 100%;
}
</style>
