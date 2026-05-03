<template>
  <div class="share-task-list">
    <table class="task-table">
      <thead>
        <tr>
          <th>WBS</th>
          <th>{{ $t('share.taskName') }}</th>
          <th>{{ $t('share.startDate') }}</th>
          <th>{{ $t('share.endDate') }}</th>
          <th>{{ $t('share.duration') }}</th>
          <th>{{ $t('share.assignee') }}</th>
          <th>{{ $t('share.status') }}</th>
          <th>{{ $t('share.milestone') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="task in flatTasks" :key="task.id" :style="{ paddingLeft: task._level * 20 + 'px' }">
          <td class="cell-wbs">{{ task.wbsCode || '-' }}</td>
          <td class="cell-name" :style="{ paddingLeft: task._level * 16 + 8 + 'px' }">
            <span v-if="task._level > 0" class="tree-indent"></span>
            {{ task.name }}
          </td>
          <td>{{ task.startDate || '-' }}</td>
          <td>{{ task.endDate || '-' }}</td>
          <td>{{ task.duration }}{{ $t('share.days') }}</td>
          <td>{{ task.assignee || '-' }}</td>
          <td>
            <span class="status-tag" :class="task.status">{{ statusMap[task.status] || task.status }}</span>
          </td>
          <td>{{ task.isMilestone ? '⭐' : '-' }}</td>
        </tr>
      </tbody>
    </table>

    <div v-if="flatTasks.length === 0" class="empty-state">
      {{ $t('share.noTasks') }}
    </div>
  </div>
</template>

<script setup>
const { t } = useI18n()

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  members: { type: Array, default: () => [] },
})

const statusMap = computed(() => ({
  pending: t('share.statusPending'),
  in_progress: t('share.statusInProgress'),
  completed: t('share.statusCompleted'),
}))

const flatTasks = computed(() => {
  const result = []
  const taskMap = new Map()
  props.tasks.forEach((t) => taskMap.set(t.id, t))

  function buildLevel(tasks, level = 0) {
    const roots = tasks.filter((t) => !t.parentId || !taskMap.has(t.parentId))
    const visited = new Set()

    function visit(task, lvl) {
      if (visited.has(task.id)) return
      visited.add(task.id)
      result.push({ ...task, _level: lvl })
      const children = tasks.filter((t) => t.parentId === task.id)
      children.forEach((child) => visit(child, lvl + 1))
    }

    roots.forEach((root) => visit(root, level))
    tasks.forEach((t) => {
      if (!visited.has(t.id)) visit(t, 0)
    })
  }

  buildLevel(props.tasks)
  return result
})
</script>

<style scoped>
.share-task-list {
  overflow-x: auto;
}

.task-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.task-table th {
  background: #f8fafc;
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.task-table td {
  padding: 0.625rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  color: #374151;
  white-space: nowrap;
}

.task-table tr:hover td {
  background: #f8fafc;
}

.cell-wbs { color: #94a3b8; font-family: monospace; }
.cell-name { font-weight: 500; color: #1a1a2e; }

.tree-indent {
  display: inline-block;
  width: 1px;
  height: 16px;
  background: #e2e8f0;
  margin-right: 8px;
  vertical-align: middle;
}

.status-tag {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-tag.pending { background: #f1f5f9; color: #64748b; }
.status-tag.in_progress { background: #dbeafe; color: #2563eb; }
.status-tag.completed { background: #dcfce7; color: #16a34a; }

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
}
</style>
