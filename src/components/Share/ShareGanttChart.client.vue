<template>
  <div ref="ganttContainer" class="share-gantt-chart"></div>
</template>

<script setup>
import { gantt } from 'dhtmlx-gantt'

const props = defineProps({
  tasks: { type: Array, default: () => [] },
})

const ganttContainer = ref(null)

onMounted(() => {
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

  gantt.init(ganttContainer.value)

  if (props.tasks.length > 0) {
    const ganttData = {
      data: props.tasks.map((task) => ({
        id: task.id,
        text: task.name,
        start_date: task.startDate || new Date().toISOString().split('T')[0],
        duration: task.duration || 1,
        progress: 0,
        parent: task.parentId || 0,
        milestone: task.isMilestone || false,
      })),
    }
    gantt.parse(ganttData)
  }
})
</script>

<style scoped>
.share-gantt-chart {
  width: 100%;
  height: 100%;
}
</style>
