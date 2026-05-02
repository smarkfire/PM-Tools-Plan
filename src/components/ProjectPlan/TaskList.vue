<template>
  <div class="task-list">
    <el-table
      :data="tasks"
      row-key="id"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      :expand-row-keys="expandedKeys"
      border
      stripe
      default-expand-all
      height="100%"
      style="width: 100%"
      @expand-change="handleExpandChange"
      :empty-text="$t('tasks.list.empty.description')"
    >
      <!-- WBS Column -->
      <el-table-column
        v-if="displaySettings.showWBS"
        prop="wbs"
        :label="$t('tasks.list.columns.wbs')"
        width="80"
        align="center"
      >
        <template #default="{ row }">
          <span class="wbs-cell">{{ row.wbs }}</span>
        </template>
      </el-table-column>

      <!-- Task Name Column -->
      <el-table-column
        v-if="displaySettings.showName"
        prop="name"
        :label="$t('tasks.list.columns.name')"
        min-width="200"
        show-overflow-tooltip
      />

      <!-- Start Date Column -->
      <el-table-column
        v-if="displaySettings.showStartDate"
        prop="startDate"
        :label="$t('tasks.list.columns.startDate')"
        width="120"
      />

      <!-- End Date Column -->
      <el-table-column
        v-if="displaySettings.showEndDate"
        prop="endDate"
        :label="$t('tasks.list.columns.endDate')"
        width="120"
      />

      <!-- Duration Column -->
      <el-table-column
        v-if="displaySettings.showDuration"
        prop="duration"
        :label="$t('tasks.list.columns.duration')"
        width="80"
        align="center"
      >
        <template #default="{ row }">
          {{ row.duration }}{{ $t('tasks.list.days') }}
        </template>
      </el-table-column>

      <!-- Deliverable Column -->
      <el-table-column
        v-if="displaySettings.showDeliverable"
        prop="deliverable"
        :label="$t('tasks.list.columns.deliverable')"
        min-width="150"
        show-overflow-tooltip
      />

      <!-- Dependencies Column -->
      <el-table-column
        v-if="displaySettings.showDependencies"
        prop="dependencies"
        :label="$t('tasks.list.columns.dependencies')"
        width="120"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          {{ (row.dependencies || []).join(', ') }}
        </template>
      </el-table-column>

      <!-- Assignee Column -->
      <el-table-column
        v-if="displaySettings.showAssignee"
        prop="assignee"
        :label="$t('tasks.list.columns.assignee')"
        width="120"
        show-overflow-tooltip
      />

      <!-- Priority Column -->
      <el-table-column
        v-if="displaySettings.showPriority"
        prop="priority"
        :label="$t('tasks.list.columns.priority')"
        width="100"
        align="center"
      >
        <template #default="{ row }">
          <el-tag :type="getPriorityType(row.priority)" size="small">
            {{ $t(getPriorityKey(row.priority)) }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- Status Column -->
      <el-table-column
        v-if="displaySettings.showStatus"
        prop="status"
        :label="$t('tasks.list.columns.status')"
        width="100"
        align="center"
      >
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ $t(getStatusKey(row.status)) }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- Description Column -->
      <el-table-column
        v-if="displaySettings.showDescription"
        prop="description"
        :label="$t('tasks.list.columns.description')"
        min-width="150"
        show-overflow-tooltip
      />

      <!-- Actions Column -->
      <el-table-column
        :label="$t('tasks.list.columns.actions')"
        width="280"
        fixed="right"
        align="center"
      >
        <template #default="{ row }">
          <div class="action-buttons">
            <el-tooltip :content="$t('tasks.list.actions.addChild')" placement="top">
              <el-button
                type="success"
                size="small"
                circle
                @click="handleAddChild(row)"
              >
                <i class="fa fa-plus"></i>
              </el-button>
            </el-tooltip>

            <el-tooltip :content="$t('tasks.list.actions.edit')" placement="top">
              <el-button
                type="primary"
                size="small"
                circle
                @click="handleEdit(row)"
              >
                <i class="fa fa-edit"></i>
              </el-button>
            </el-tooltip>

            <el-tooltip :content="$t('tasks.list.actions.delete')" placement="top">
              <el-button
                type="danger"
                size="small"
                circle
                @click="handleDelete(row)"
              >
                <i class="fa fa-trash"></i>
              </el-button>
            </el-tooltip>

            <el-tooltip :content="$t('tasks.list.actions.moveUp')" placement="top">
              <el-button
                size="small"
                circle
                @click="handleMoveUp(row)"
                :disabled="isFirstSibling(row)"
              >
                <i class="fa fa-arrow-up"></i>
              </el-button>
            </el-tooltip>

            <el-tooltip :content="$t('tasks.list.actions.moveDown')" placement="top">
              <el-button
                size="small"
                circle
                @click="handleMoveDown(row)"
                :disabled="isLastSibling(row)"
              >
                <i class="fa fa-arrow-down"></i>
              </el-button>
            </el-tooltip>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { findTask, getSiblingTasks } from '~/utils/wbs'

const { t } = useI18n()

const props = defineProps({
  tasks: {
    type: Array,
    default: () => []
  },
  displaySettings: {
    type: Object,
    default: () => ({})
  },
  expandedTasks: {
    type: Set,
    default: () => new Set()
  }
})

const emit = defineEmits([
  'edit-task',
  'delete-task',
  'add-child-task',
  'reorder-task',
  'toggle-expand'
])

const expandedKeys = ref([])

// Watch for tasks changes (for debugging)
watch(() => props.tasks, (newTasks) => {
  console.log('TaskList received new tasks:', newTasks?.length || 0, 'tasks')
}, { deep: true, immediate: true })

// Watch for expanded tasks changes
const syncExpandedKeys = () => {
  expandedKeys.value = Array.from(props.expandedTasks || [])
}

syncExpandedKeys()

const handleExpandChange = (row, expanded) => {
  emit('toggle-expand', row.id)
}

const handleAddChild = (row) => {
  emit('add-child-task', row)
}

const handleEdit = (row) => {
  emit('edit-task', row)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    t('tasks.list.messages.confirmDelete', {
      name: row.name,
      childrenWarning: hasChildren(row) ? t('tasks.list.messages.deleteWithChildren') : ''
    }),
    t('common.messages.confirmDelete'),
    {
      confirmButtonText: t('common.buttons.confirm'),
      cancelButtonText: t('common.buttons.cancel'),
      type: 'warning'
    }
  ).then(() => {
    emit('delete-task', row)
  }).catch(() => {
    // User cancelled
  })
}

const handleMoveUp = (row) => {
  emit('reorder-task', row.id, 'up')
}

const handleMoveDown = (row) => {
  emit('reorder-task', row.id, 'down')
}

const hasChildren = (task) => {
  return task.children && Array.isArray(task.children) && task.children.length > 0
}

const isFirstSibling = (task) => {
  const siblings = getSiblingTasks(task, props.tasks)
  return siblings.findIndex(t => t.id === task.id) === 0
}

const isLastSibling = (task) => {
  const siblings = getSiblingTasks(task, props.tasks)
  return siblings.findIndex(t => t.id === task.id) === siblings.length - 1
}

const getPriorityKey = (priority) => {
  const keys = {
    '高': 'common.priority.high',
    '中': 'common.priority.medium',
    '低': 'common.priority.low',
    'High': 'common.priority.high',
    'Medium': 'common.priority.medium',
    'Low': 'common.priority.low'
  }
  return keys[priority] || priority
}

const getPriorityType = (priority) => {
  const types = {
    '高': 'danger',
    '中': 'warning',
    '低': 'success',
    'High': 'danger',
    'Medium': 'warning',
    'Low': 'success'
  }
  return types[priority] || ''
}

const getStatusKey = (status) => {
  const keys = {
    '待办': 'common.status.todo',
    '进行中': 'common.status.inProgress',
    '已完成': 'common.status.completed',
    'To Do': 'common.status.todo',
    'In Progress': 'common.status.inProgress',
    'Completed': 'common.status.completed'
  }
  return keys[status] || status
}

const getStatusType = (status) => {
  const types = {
    '待办': 'info',
    '进行中': 'warning',
    '已完成': 'success',
    'To Do': 'info',
    'In Progress': 'warning',
    'Completed': 'success'
  }
  return types[status] || ''
}
</script>

<style scoped>
.task-list {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

</style>
