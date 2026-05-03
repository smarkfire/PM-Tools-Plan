<template>
  <el-dialog
    v-model="dialogVisible"
    :title="t('gantt.colorScheme.title')"
    width="640px"
    :close-on-click-modal="false"
    destroy-on-close
    class="color-scheme-dialog"
  >
    <div class="mode-switch">
      <span class="mode-label">{{ t('gantt.colorScheme.dimension') }}</span>
      <el-radio-group v-model="currentMode" size="small">
        <el-radio-button value="status">{{ t('gantt.colorScheme.byStatus') }}</el-radio-button>
        <el-radio-button value="priority">{{ t('gantt.colorScheme.byPriority') }}</el-radio-button>
      </el-radio-group>
    </div>

    <div class="scheme-list">
      <div
        v-for="scheme in schemes"
        :key="scheme.name"
        class="scheme-card"
        :class="{ active: currentName === scheme.name }"
        @click="currentName = scheme.name"
      >
        <div class="scheme-header">
          <span class="scheme-name">{{ t(`gantt.colorScheme.schemes.${scheme.name}`) }}</span>
          <i v-if="currentName === scheme.name" class="fa fa-check-circle scheme-check"></i>
        </div>
        <div class="scheme-colors">
          <div
            v-for="color in getCurrentColors(scheme)"
            :key="color.label"
            class="color-chip"
          >
            <span class="chip-dot" :style="{ background: color.bg }"></span>
            <span class="chip-label" :style="{ color: color.textColor }">{{ color.label }}</span>
          </div>
        </div>
        <div class="scheme-preview">
          <div
            v-for="(bar, idx) in previewBars"
            :key="idx"
            class="preview-bar-wrapper"
          >
            <div
              class="preview-bar"
              :style="{
                background: getBarColor(scheme, idx),
                color: getBarTextColor(scheme),
                width: bar.width,
                left: bar.left
              }"
            >
              {{ bar.label }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleCancel">{{ t('common.buttons.cancel') }}</el-button>
      <el-button type="primary" @click="handleApply">{{ t('gantt.colorScheme.apply') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useTasksStore } from '~/store/tasks'

const { t } = useI18n()
const tasksStore = useTasksStore()

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible'])

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const currentMode = ref('status')
const currentName = ref('classic')

const schemes = [
  {
    name: 'classic',
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
    },
    textColor: '#333333'
  },
  {
    name: 'ocean',
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
    },
    textColor: '#ffffff'
  },
  {
    name: 'warm',
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
    },
    textColor: '#333333'
  },
  {
    name: 'forest',
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
    },
    textColor: '#ffffff'
  },
  {
    name: 'neon',
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
    },
    textColor: '#ffffff'
  }
]

const previewBars = computed(() => [
  { label: t('gantt.colorScheme.preview.task1'), width: '35%', left: '2%' },
  { label: t('gantt.colorScheme.preview.task2'), width: '40%', left: '15%' },
  { label: t('gantt.colorScheme.preview.task3'), width: '25%', left: '30%' },
  { label: t('gantt.colorScheme.preview.task4'), width: '35%', left: '45%' }
])

const statusKeys = ['pending', 'inProgress', 'completed', 'paused']
const priorityKeys = ['high', 'medium', 'low']

const getCurrentColors = (scheme: any) => {
  const colors = currentMode.value === 'status' ? scheme.status : scheme.priority
  const keys = currentMode.value === 'status' ? statusKeys : priorityKeys
  const labels: Record<string, string> = {
    pending: t('common.status.todo'),
    inProgress: t('common.status.inProgress'),
    completed: t('common.status.completed'),
    paused: t('common.status.onHold'),
    high: t('common.priority.high'),
    medium: t('common.priority.medium'),
    low: t('common.priority.low')
  }
  return keys.map(key => ({
    label: labels[key],
    bg: colors[key].bg,
    textColor: colors[key].text
  }))
}

const getBarColor = (scheme: any, idx: number) => {
  const colors = currentMode.value === 'status' ? scheme.status : scheme.priority
  const keys = currentMode.value === 'status' ? statusKeys : priorityKeys
  const key = keys[idx % keys.length]
  return colors[key].bg
}

const getBarTextColor = (scheme: any) => {
  return scheme.textColor
}

watch(() => props.visible, (val) => {
  if (val) {
    currentMode.value = tasksStore.colorScheme.mode
    currentName.value = tasksStore.colorScheme.name
  }
})

const handleCancel = () => {
  emit('update:visible', false)
}

const handleApply = () => {
  tasksStore.updateColorScheme({
    mode: currentMode.value,
    name: currentName.value
  })
  emit('update:visible', false)
}
</script>

<style scoped>
.mode-switch {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.mode-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.scheme-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 480px;
  overflow-y: auto;
  padding-right: 4px;
}

.scheme-card {
  padding: 16px;
  border-radius: 12px;
  border: 2px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--el-bg-color);
}

.scheme-card:hover {
  border-color: var(--el-color-primary-light-3);
}

.scheme-card.active {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
}

.scheme-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.scheme-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.scheme-check {
  font-size: 18px;
  color: var(--el-color-primary);
}

.scheme-colors {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.color-chip {
  display: flex;
  align-items: center;
  gap: 6px;
}

.chip-dot {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  flex-shrink: 0;
}

.chip-label {
  font-size: 12px;
  font-weight: 500;
}

.scheme-preview {
  position: relative;
  height: 32px;
  background: #f5f7fa;
  border-radius: 6px;
  overflow: hidden;
}

.preview-bar-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.preview-bar {
  position: absolute;
  top: 4px;
  height: 24px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  display: flex;
  align-items: center;
  padding: 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 0.3s ease;
}
</style>
