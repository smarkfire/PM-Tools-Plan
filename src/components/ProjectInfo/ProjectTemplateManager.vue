<template>
  <div class="project-template-manager">
    <div class="manager-header">
      <h3>项目模板</h3>
      <el-button type="primary" size="small" :disabled="!canSaveAsTemplate" @click="handleSaveAsTemplate">
        <el-icon><Plus /></el-icon> 另存为模板
      </el-button>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="官方模板" name="official">
        <div v-if="loading" class="loading-state">加载中...</div>
        <div v-else-if="officialTemplates.length === 0" class="empty-state">暂无官方模板</div>
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
              <span>{{ (tpl.phases || []).length }} 个阶段</span>
              <span>{{ getTotalTasks(tpl) }} 个任务</span>
              <span>{{ tpl.usageCount || 0 }} 次使用</span>
            </div>
            <el-button type="primary" size="small" class="apply-btn">应用此模板</el-button>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="我的模板" name="custom">
        <div v-if="loading" class="loading-state">加载中...</div>
        <div v-else-if="customTemplates.length === 0" class="empty-state">
          <p>暂无自定义模板</p>
          <p class="hint">在项目设置中点击"另存为模板"来创建</p>
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
              <span>{{ (tpl.phases || []).length }} 个阶段</span>
              <span>{{ getTotalTasks(tpl) }} 个任务</span>
            </div>
            <div class="card-actions">
              <el-button type="primary" size="small" @click="handleApply(tpl)">应用</el-button>
              <el-button size="small" @click="handleEdit(tpl)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(tpl)">删除</el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="saveDialogVisible" title="另存为模板" width="500px">
      <el-form ref="saveFormRef" :model="saveForm" :rules="saveRules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="saveForm.name" placeholder="模板名称" maxlength="200" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="saveForm.icon" placeholder="Emoji 图标" maxlength="10" style="width: 80px" />
        </el-form-item>
        <el-form-item label="行业" prop="industry">
          <el-input v-model="saveForm.industry" placeholder="如：软件开发" maxlength="50" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="saveForm.description" type="textarea" :rows="2" placeholder="模板描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="confirmSaveTemplate">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="编辑模板" width="500px">
      <el-form ref="editFormRef" :model="editForm" :rules="saveRules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="editForm.name" maxlength="200" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="editForm.icon" maxlength="10" style="width: 80px" />
        </el-form-item>
        <el-form-item label="行业" prop="industry">
          <el-input v-model="editForm.industry" maxlength="50" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="editForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="confirmEditTemplate">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

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

const saveRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
}

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
      `应用模板「${tpl.name}」将创建一个新项目，是否继续？`,
      '应用模板',
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
      ElMessage.success('项目已创建')
      emit('apply', project)
    } else {
      ElMessage.error('应用失败')
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
      ElMessage.success('模板已保存')
      saveDialogVisible.value = false
      await fetchTemplates()
    } else {
      ElMessage.error('保存失败')
    }
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

function buildPhasesFromTasks(tasks) {
  const grouped = {}
  for (const task of tasks) {
    const phase = task.phase || '默认阶段'
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
      ElMessage.success('模板已更新')
      editDialogVisible.value = false
      await fetchTemplates()
    } else {
      ElMessage.error('更新失败')
    }
  } catch (e) {
    ElMessage.error('更新失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(tpl) {
  try {
    await ElMessageBox.confirm(`确定删除模板「${tpl.name}」？`, '确认删除', { type: 'warning' })
    const token = localStorage.getItem('auth_token')
    const res = await fetch(`/api/templates/projects/${tpl.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      ElMessage.success('删除成功')
      await fetchTemplates()
    } else {
      ElMessage.error('删除失败')
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
