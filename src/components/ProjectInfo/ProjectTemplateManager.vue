<template>
  <div class="project-template-manager">
    <div class="manager-header">
      <h3>{{ $t('projectTemplate.title') }}</h3>
      <el-button type="primary" size="small" :disabled="!canSaveAsTemplate" @click="handleSaveAsTemplate">
        <el-icon><Plus /></el-icon> {{ $t('projectTemplate.saveAsTemplate') }}
      </el-button>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane :label="$t('projectTemplate.officialTab')" name="official">
        <div v-if="loading" class="loading-state">{{ $t('common.messages.loading') }}</div>
        <div v-else-if="officialTemplates.length === 0" class="empty-state">{{ $t('projectTemplate.noOfficial') }}</div>
        <div v-else class="template-grid">
          <div
            v-for="tpl in officialTemplates"
            :key="tpl.id"
            class="template-card"
            @click="handleApply(tpl)"
          >
            <div class="card-icon">{{ tpl.icon || '📋' }}</div>
            <div class="card-name">{{ tpl.name }}</div>
            <div class="card-desc">{{ tpl.description }}</div>
            <div class="card-info">
              <span>{{ (tpl.phases || []).length }} {{ $t('projectTemplate.phases') }}</span>
              <span>{{ getTotalTasks(tpl) }} {{ $t('projectTemplate.tasks') }}</span>
              <span>{{ tpl.usageCount || 0 }} {{ $t('projectTemplate.usages') }}</span>
            </div>
            <el-button type="primary" size="small" class="apply-btn">{{ $t('projectTemplate.applyBtn') }}</el-button>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane :label="$t('projectTemplate.customTab')" name="custom">
        <div v-if="loading" class="loading-state">{{ $t('common.messages.loading') }}</div>
        <div v-else-if="customTemplates.length === 0" class="empty-state">
          <p>{{ $t('projectTemplate.noCustom') }}</p>
          <p class="hint">{{ $t('projectTemplate.noCustomHint') }}</p>
        </div>
        <div v-else class="template-grid">
          <div
            v-for="tpl in customTemplates"
            :key="tpl.id"
            class="template-card"
          >
            <div class="card-icon">{{ tpl.icon || '📋' }}</div>
            <div class="card-name">{{ tpl.name }}</div>
            <div class="card-desc">{{ tpl.description }}</div>
            <div class="card-info">
              <span>{{ (tpl.phases || []).length }} {{ $t('projectTemplate.phases') }}</span>
              <span>{{ getTotalTasks(tpl) }} {{ $t('projectTemplate.tasks') }}</span>
            </div>
            <div class="card-actions">
              <el-button type="primary" size="small" @click="handleApply(tpl)">{{ $t('projectTemplate.apply') }}</el-button>
              <el-button size="small" @click="handleEdit(tpl)">{{ $t('common.buttons.edit') }}</el-button>
              <el-button size="small" type="danger" @click="handleDelete(tpl)">{{ $t('common.buttons.delete') }}</el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="saveDialogVisible" :title="$t('projectTemplate.saveDialog.title')" width="500px">
      <el-form ref="saveFormRef" :model="saveForm" :rules="saveRules" label-width="80px">
        <el-form-item :label="$t('projectTemplate.saveDialog.name')" prop="name">
          <el-input v-model="saveForm.name" :placeholder="$t('projectTemplate.saveDialog.namePlaceholder')" maxlength="200" />
        </el-form-item>
        <el-form-item :label="$t('projectTemplate.saveDialog.icon')" prop="icon">
          <el-input v-model="saveForm.icon" :placeholder="$t('projectTemplate.saveDialog.iconPlaceholder')" maxlength="10" style="width: 80px" />
        </el-form-item>
        <el-form-item :label="$t('projectTemplate.saveDialog.industry')" prop="industry">
          <el-input v-model="saveForm.industry" :placeholder="$t('projectTemplate.saveDialog.industryPlaceholder')" maxlength="50" />
        </el-form-item>
        <el-form-item :label="$t('projectTemplate.saveDialog.description')" prop="description">
          <el-input v-model="saveForm.description" type="textarea" :rows="2" :placeholder="$t('projectTemplate.saveDialog.descriptionPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveDialogVisible = false">{{ $t('common.buttons.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="confirmSaveTemplate">{{ $t('common.buttons.save') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" :title="$t('projectTemplate.editDialog.title')" width="500px">
      <el-form ref="editFormRef" :model="editForm" :rules="saveRules" label-width="80px">
        <el-form-item :label="$t('projectTemplate.saveDialog.name')" prop="name">
          <el-input v-model="editForm.name" maxlength="200" />
        </el-form-item>
        <el-form-item :label="$t('projectTemplate.saveDialog.icon')" prop="icon">
          <el-input v-model="editForm.icon" maxlength="10" style="width: 80px" />
        </el-form-item>
        <el-form-item :label="$t('projectTemplate.saveDialog.industry')" prop="industry">
          <el-input v-model="editForm.industry" maxlength="50" />
        </el-form-item>
        <el-form-item :label="$t('projectTemplate.saveDialog.description')" prop="description">
          <el-input v-model="editForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">{{ $t('common.buttons.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="confirmEditTemplate">{{ $t('common.buttons.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  currentProject: { type: Object, default: null },
  currentTasks: { type: Array, default: () => [] },
})

const emit = defineEmits(['apply'])

const loading = ref(false)
const templates = ref([])
const activeTab = ref('official')
const saving = ref(false)
const saveDialogVisible = ref(false)
const editDialogVisible = ref(false)
const saveFormRef = ref(null)
const editFormRef = ref(null)

const saveForm = ref({ name: '', icon: '📋', industry: '', description: '' })
const editForm = ref({ id: '', name: '', icon: '', industry: '', description: '' })

const saveRules = computed(() => ({
  name: [{ required: true, message: t('projectTemplate.saveDialog.nameRequired'), trigger: 'blur' }],
}))

const officialTemplates = computed(() => templates.value.filter(t => t.isOfficial))
const customTemplates = computed(() => templates.value.filter(t => !t.isOfficial))

const canSaveAsTemplate = computed(() => props.currentProject && props.currentTasks.length > 0)

function getTotalTasks(tpl) {
  return (tpl.phases || []).reduce((sum, p) => sum + (p.tasks || []).length, 0)
}

async function fetchTemplates() {
  loading.value = true
  try {
    const token = localStorage.getItem('auth_token')
    const res = await fetch('/api/templates/projects', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      templates.value = await res.json()
    }
  } catch (e) {
    console.error('Failed to fetch project templates:', e)
  } finally {
    loading.value = false
  }
}

async function handleApply(tpl) {
  try {
    await ElMessageBox.confirm(
      t('projectTemplate.applyConfirm', { name: tpl.name }),
      t('projectTemplate.applyTitle'),
      { type: 'info' }
    )
    const token = localStorage.getItem('auth_token')
    const res = await fetch(`/api/templates/projects/${tpl.id}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: tpl.name }),
    })
    if (res.ok) {
      const project = await res.json()
      ElMessage.success(t('projectTemplate.projectCreated'))
      emit('apply', project)
    } else {
      ElMessage.error(t('projectTemplate.applyFailed'))
    }
  } catch {}
}

function handleSaveAsTemplate() {
  if (!props.currentProject) return
  saveForm.value = {
    name: props.currentProject.name || '',
    icon: '📋',
    industry: '',
    description: props.currentProject.description || '',
  }
  saveDialogVisible.value = true
}

async function confirmSaveTemplate() {
  if (!saveFormRef.value) return
  await saveFormRef.value.validate()
  saving.value = true
  try {
    const phases = buildPhasesFromTasks(props.currentTasks)
    const token = localStorage.getItem('auth_token')
    const res = await fetch('/api/templates/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...saveForm.value, phases }),
    })
    if (res.ok) {
      ElMessage.success(t('projectTemplate.templateSaved'))
      saveDialogVisible.value = false
      await fetchTemplates()
    } else {
      ElMessage.error(t('projectTemplate.saveFailed'))
    }
  } catch (e) {
    ElMessage.error(t('projectTemplate.saveFailed'))
  } finally {
    saving.value = false
  }
}

function buildPhasesFromTasks(tasks) {
  const grouped = {}
  for (const task of tasks) {
    const phase = task.phase || t('projectTemplate.defaultPhase')
    if (!grouped[phase]) grouped[phase] = []
    grouped[phase].push({
      name: task.name,
      duration: task.duration || 1,
      deliverable: task.deliverable || '',
    })
  }
  return Object.entries(grouped).map(([name, tasks]) => ({ name, tasks }))
}

function handleEdit(tpl) {
  editForm.value = {
    id: tpl.id,
    name: tpl.name,
    icon: tpl.icon || '📋',
    industry: tpl.industry || '',
    description: tpl.description || '',
  }
  editDialogVisible.value = true
}

async function confirmEditTemplate() {
  if (!editFormRef.value) return
  await editFormRef.value.validate()
  saving.value = true
  try {
    const token = localStorage.getItem('auth_token')
    const res = await fetch(`/api/templates/projects/${editForm.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: editForm.value.name,
        icon: editForm.value.icon,
        industry: editForm.value.industry,
        description: editForm.value.description,
      }),
    })
    if (res.ok) {
      ElMessage.success(t('projectTemplate.templateUpdated'))
      editDialogVisible.value = false
      await fetchTemplates()
    } else {
      ElMessage.error(t('projectTemplate.updateFailed'))
    }
  } catch (e) {
    ElMessage.error(t('projectTemplate.updateFailed'))
  } finally {
    saving.value = false
  }
}

async function handleDelete(tpl) {
  try {
    await ElMessageBox.confirm(t('projectTemplate.deleteConfirm', { name: tpl.name }), t('projectTemplate.deleteTitle'), { type: 'warning' })
    const token = localStorage.getItem('auth_token')
    const res = await fetch(`/api/templates/projects/${tpl.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      ElMessage.success(t('projectTemplate.deleted'))
      await fetchTemplates()
    } else {
      ElMessage.error(t('projectTemplate.deleteFailed'))
    }
  } catch {}
}

onMounted(fetchTemplates)
</script>

<style scoped>
.project-template-manager { padding: 0; }
.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.manager-header h3 { margin: 0; font-size: 16px; }
.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.template-card {
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.template-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.card-icon { font-size: 28px; margin-bottom: 8px; }
.card-name { font-weight: 500; margin-bottom: 4px; }
.card-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-info {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-bottom: 8px;
}
.apply-btn { width: 100%; }
.card-actions {
  display: flex;
  gap: 4px;
  width: 100%;
}
.card-actions .el-button { flex: 1; }
.loading-state, .empty-state {
  text-align: center;
  padding: 24px;
  color: var(--el-text-color-secondary);
}
.hint { font-size: 12px; }
</style>
