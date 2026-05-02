<template>
  <div class="task-tree">
    <div
      v-for="(task, index) in tasks"
      :key="index"
      class="task-node"
    >
      <div class="task-item" :style="{ paddingLeft: `${depth * 24}px` }">
        <div class="task-expand" v-if="task.children && task.children.length > 0" @click="toggleExpand(index)">
          <i :class="expanded[index] ? 'fa fa-chevron-down' : 'fa fa-chevron-right'" />
        </div>
        <div class="task-expand" v-else />
        <div class="task-info">
          <span class="task-name">{{ task.name }}</span>
          <span class="task-duration">{{ task.duration }}{{ t('ai.wizard.statDurationUnit') }}</span>
          <span class="task-deliverable" v-if="task.deliverable">{{ task.deliverable }}</span>
        </div>
      </div>
      <div v-if="task.children && task.children.length > 0 && expanded[index]" class="task-children">
        <TaskTreeNode :tasks="task.children" :depth="depth + 1" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

const props = defineProps<{
  tasks: any[]
  depth?: number
}>()

const expanded = ref<Record<number, boolean>>({})

const toggleExpand = (index: number) => {
  expanded.value[index] = !expanded.value[index]
}

onMounted(() => {
  if (props.tasks) {
    props.tasks.forEach((_, i) => {
      expanded.value[i] = true
    })
  }
})
</script>

<style scoped>
.task-tree {
  font-size: 0.9rem;
}

.task-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.task-item:hover {
  background: #f5f7fa;
}

.task-expand {
  width: 20px;
  cursor: pointer;
  color: #909399;
  flex-shrink: 0;
}

.task-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.task-name {
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-duration {
  color: #409eff;
  font-size: 0.8rem;
  white-space: nowrap;
  background: #ecf5ff;
  padding: 2px 8px;
  border-radius: 4px;
}

.task-deliverable {
  color: #909399;
  font-size: 0.8rem;
  white-space: nowrap;
}

.task-children {
  border-left: 2px solid #e4e7ed;
  margin-left: 12px;
}
</style>
