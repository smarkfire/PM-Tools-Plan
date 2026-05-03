<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <el-dropdown @command="handleDataAction" split-button type="warning">
        <i class="fa fa-database mr-1"></i>
        {{ $t('tasks.plan.toolbar.data') }}
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="load-mock">
              <i class="fa fa-download mr-2"></i>
              {{ $t('tasks.plan.toolbar.loadMock') }}
            </el-dropdown-item>
            <el-dropdown-item command="clear-all" divided>
              <i class="fa fa-trash-alt mr-2"></i>
              {{ $t('tasks.plan.toolbar.clearAll') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-button type="primary" @click="$emit('add-root-task')">
        <i class="fa fa-plus mr-1"></i>
        {{ $t('tasks.plan.toolbar.addRootTask') }}
      </el-button>
      <el-button type="success" @click="$emit('save')">
        <i class="fa fa-save mr-1"></i>
        {{ $t('tasks.plan.toolbar.save') }}
      </el-button>
    </div>

    <!-- <div class="toolbar-center">

    </div> -->

    <div class="toolbar-right">
      <el-dropdown @command="handleImport" split-button type="warning">
        <i class="fa fa-upload mr-1"></i>
        {{ $t('tasks.plan.toolbar.import') }}
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="json">{{ $t('tasks.plan.import.formats.json') }}</el-dropdown-item>
            <el-dropdown-item command="excel">{{ $t('tasks.plan.import.formats.excel') }}</el-dropdown-item>
            <el-dropdown-item command="markdown">{{ $t('tasks.plan.import.formats.markdown') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-dropdown @command="handleExport" split-button type="primary">
        <i class="fa fa-download mr-1"></i>
        {{ $t('tasks.plan.toolbar.export') }}
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="json">{{ $t('tasks.plan.export.formats.json') }}</el-dropdown-item>
            <el-dropdown-item command="excel">{{ $t('tasks.plan.export.formats.excel') }}</el-dropdown-item>
            <el-dropdown-item command="markdown">{{ $t('tasks.plan.export.formats.markdown') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-button type="info" @click="$emit('export-gantt')">
        <i class="fa fa-image mr-1"></i>
        {{ $t('tasks.plan.toolbar.exportGantt') }}
      </el-button>

      <el-dropdown @command="handleSettingsAction" split-button type="info">
        <i class="fa fa-sliders mr-1"></i>
        {{ $t('tasks.plan.toolbar.settings') }}
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="toggle-task-list">
              <i class="fa mr-2" :class="showTaskList ? 'fa-list-ul':'fa-list' "></i>
              {{ showTaskList ? $t('tasks.plan.toolbar.hideTaskList') : $t('tasks.plan.toolbar.showTaskList') }}
            </el-dropdown-item>
            <el-dropdown-item command="open-display-settings" divided>
              <i class="fa fa-cog mr-2"></i>
              {{ $t('tasks.plan.toolbar.displaySettings') }}
            </el-dropdown-item>
            <el-dropdown-item command="open-gantt-column-settings">
              <i class="fa fa-columns mr-2"></i>
              {{ $t('tasks.plan.toolbar.ganttColumnSettings') }}
            </el-dropdown-item>
            <el-dropdown-item command="open-color-scheme" divided>
              <i class="fa fa-palette mr-2"></i>
              {{ $t('tasks.plan.toolbar.colorScheme') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  showTaskList: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'add-root-task',
  'save',
  'import',
  'export',
  'export-gantt',
  'toggle-expand',
  'open-display-settings',
  'data-action',
  'toggle-task-list-visibility',
  'open-gantt-column-settings',
  'open-color-scheme'
])

const handleImport = (format) => {
  emit('import', format)
}

const handleExport = (format) => {
  emit('export', format)
}

const handleDataAction = (action) => {
  emit('data-action', action)
}

const handleSettingsAction = (action) => {
  if (action === 'toggle-task-list') {
    emit('toggle-task-list-visibility')
  } else if (action === 'open-display-settings') {
    emit('open-display-settings')
  } else if (action === 'open-gantt-column-settings') {
    emit('open-gantt-column-settings')
  } else if (action === 'open-color-scheme') {
    emit('open-color-scheme')
  }
}
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px 0;
}

.toolbar-left,
.toolbar-center,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-center {
  flex: 1;
  justify-content: center;
}

@media (max-width: 1200px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-left,
  .toolbar-center,
  .toolbar-right {
    justify-content: center;
    width: 100%;
  }
}
</style>
