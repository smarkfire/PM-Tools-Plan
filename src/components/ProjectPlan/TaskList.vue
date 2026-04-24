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
      empty-text="暂无任务，请点击新增按钮创建任务"
    >
      <!-- WBS Column -->
      <el-table-column
        v-if="displaySettings.showWBS"
        prop="wbs"
        label="WBS"
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
        label="任务名称"
        min-width="200"
        show-overflow-tooltip
      />

      <!-- Start Date Column -->
      <el-table-column
        v-if="displaySettings.showStartDate"
        prop="startDate"
        label="开始时间"
        width="120"
      />

      <!-- End Date Column -->
      <el-table-column
        v-if="displaySettings.showEndDate"
        prop="endDate"
        label="结束时间"
        width="120"
      />

      <!-- Duration Column -->
      <el-table-column
        v-if="displaySettings.showDuration"
        prop="duration"
        label="工期"
        width="80"
        align="center"
      >
        <template #default="{ row }">
          {{ row.duration }}天
        </template>
      </el-table-column>

      <!-- Deliverable Column -->
      <el-table-column
        v-if="displaySettings.showDeliverable"
        prop="deliverable"
        label="交付物"
        min-width="150"
        show-overflow-tooltip
      />

      <!-- Dependencies Column -->
      <el-table-column
        v-if="displaySettings.showDependencies"
        prop="dependencies"
        label="依赖"
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
        label="负责人"
        width="120"
        show-overflow-tooltip
      />

      <!-- Priority Column -->
      <el-table-column
        v-if="displaySettings.showPriority"
        prop="priority"
        label="优先级"
        width="100"
        align="center"
      >
        <template #default="{ row }">
          <el-tag :type="getPriorityType(row.priority)" size="small">
            {{ row.priority }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- Status Column -->
      <el-table-column
        v-if="displaySettings.showStatus"
        prop="status"
        label="状态"
        width="100"
        align="center"
      >
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- Description Column -->
      <el-table-column
        v-if="displaySettings.showDescription"
        prop="description"
        label="备注"
        min-width="150"
        show-overflow-tooltip
      />

      <!-- Actions Column -->
      <el-table-column
        label="操作"
        width="280"
        fixed="right"
        align="center"
      >
        <template #default="{ row }">
          <div class="action-buttons">
            <el-tooltip content="新增子任务" placement="top">
              <el-button
                type="success"
                size="small"
                circle
                @click="handleAddChild(row)"
              >
                <i class="fa fa-plus"></i>
              </el-button>
            </el-tooltip>

            <el-tooltip content="编辑任务" placement="top">
              <el-button
                type="primary"
                size="small"
                circle
                @click="handleEdit(row)"
              >
                <i class="fa fa-edit"></i>
              </el-button>
            </el-tooltip>

            <el-tooltip content="删除任务" placement="top">
              <el-button
                type="danger"
                size="small"
                circle
                @click="handleDelete(row)"
              >
                <i class="fa fa-trash"></i>
              </el-button>
            </el-tooltip>

            <el-tooltip content="上移" placement="top">
              <el-button
                size="small"
                circle
                @click="handleMoveUp(row)"
                :disabled="isFirstSibling(row)"
              >
                <i class="fa fa-arrow-up"></i>
              </el-button>
            </el-tooltip>

            <el-tooltip content="下移" placement="top">
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
import { findTask, getSiblingTasks } from '@/utils/wbs'

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
    `确定要删除任务"${row.name}"吗？${hasChildren(row) ? '此操作将同时删除所有子任务。' : ''}`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
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

const getPriorityType = (priority) => {
  const types = {
    '高': 'danger',
    '中': 'warning',
    '低': 'success'
  }
  return types[priority] || ''
}

const getStatusType = (status) => {
  const types = {
    '待办': 'info',
    '进行中': 'warning',
    '已完成': 'success'
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
