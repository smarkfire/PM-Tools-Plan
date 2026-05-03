<template>
  <div class="prompt-template-manager">
    <div class="manager-header">
      <h3>{{ $t('ai.promptManager.title') }}</h3>
      <el-button type="primary" size="small" @click="showEditor(null)">
        <el-icon><Plus /></el-icon> {{ $t('ai.promptManager.create') }}
      </el-button>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane :label="$t('ai.promptManager.official')" name="official">
        <div v-if="loading" class="loading-state">{{ $t('common.messages.loading') }}</div>
        <div v-else-if="officialTemplates.length === 0" class="empty-state">{{ $t('ai.promptManager.noOfficial') }}</div>
        <div v-else class="template-list">
          <div
            v-for="tpl in officialTemplates"
            :key="tpl.id"
            class="template-item"
            :class="{ active: selectedId === tpl.id }"
            @click="handleSelect(tpl)"
          >
            <div class="template-info">
              <div class="template-name">{{ tpl.name }}</div>
              <div class="template-meta">
                <el-tag size="small" type="info">{{ categoryLabel(tpl.category) }}</el-tag>
              </div>
              <div class="template-desc">{{ tpl.description }}</div>
            </div>
            <div class="template-actions">
              <el-button size="small" @click.stop="previewPrompt(tpl)">{{ $t('ai.promptManager.preview') }}</el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane :label="$t('ai.promptManager.custom')" name="custom">
        <div v-if="loading" class="loading-state">{{ $t('common.messages.loading') }}</div>
        <div v-else-if="customTemplates.length === 0" class="empty-state">
          <p>{{ $t('ai.promptManager.noCustom') }}</p>
          <el-button type="primary" size="small" @click="showEditor(null)">{{ $t('ai.promptManager.createFirst') }}</el-button>
        </div>
        <div v-else class="template-list">
          <div
            v-for="tpl in customTemplates"
            :key="tpl.id"
            class="template-item"
            :class="{ active: selectedId === tpl.id }"
            @click="handleSelect(tpl)"
          >
            <div class="template-info">
              <div class="template-name">{{ tpl.name }}</div>
              <div class="template-meta">
                <el-tag size="small" type="info">{{ categoryLabel(tpl.category) }}</el-tag>
              </div>
              <div class="template-desc">{{ tpl.description }}</div>
            </div>
            <div class="template-actions">
              <el-button size="small" @click.stop="previewPrompt(tpl)">{{ $t('ai.promptManager.preview') }}</el-button>
              <el-button size="small" @click.stop="showEditor(tpl)">{{ $t('ai.promptManager.edit') }}</el-button>
              <el-button size="small" type="danger" @click.stop="handleDelete(tpl)">{{ $t('ai.promptManager.delete') }}</el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <PromptTemplateEditor
      v-model="editorVisible"
      :template="editingTemplate"
      @saved="handleSaved"
    />

    <el-dialog v-model="previewVisible" :title="$t('ai.market.previewTitle')" width="600px">
      <div v-if="previewData" class="prompt-preview">
        <h4>{{ previewData.name }}</h4>
        <p class="preview-desc">{{ previewData.description }}</p>
        <pre class="preview-content">{{ previewData.systemPrompt }}</pre>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import PromptTemplateEditor from './PromptTemplateEditor.vue'

const { t } = useI18n()
const emit = defineEmits(['select'])

const loading = ref(false)
const templates = ref([])
const activeTab = ref('official')
const selectedId = ref(null)
const editorVisible = ref(false)
const editingTemplate = ref(null)
const previewVisible = ref(false)
const previewData = ref(null)

const officialTemplates = computed(() => templates.value.filter(t => t.isOfficial))
const customTemplates = computed(() => templates.value.filter(t => !t.isOfficial))

function categoryLabel(cat) {
  const map = {
    general: t('ai.promptEditor.categoryGeneral'),
    industry: t('ai.promptEditor.categoryIndustry'),
    report: t('ai.promptEditor.categoryReport'),
    chat: t('ai.promptEditor.categoryChat'),
  }
  return map[cat] || cat
}

async function fetchTemplates() {
  loading.value = true
  try {
    const token = localStorage.getItem('auth_token')
    const res = await fetch('/api/templates/prompts', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      templates.value = await res.json()
    }
  } catch (e) {
    console.error('Failed to fetch prompt templates:', e)
  } finally {
    loading.value = false
  }
}

function handleSelect(tpl) {
  selectedId.value = tpl.id
  emit('select', tpl)
}

function showEditor(tpl) {
  editingTemplate.value = tpl
  editorVisible.value = true
}

function previewPrompt(tpl) {
  previewData.value = tpl
  previewVisible.value = true
}

async function handleDelete(tpl) {
  try {
    await ElMessageBox.confirm(t('ai.promptManager.deleteConfirm', { name: tpl.name }), t('ai.promptManager.deleteTitle'), { type: 'warning' })
    const token = localStorage.getItem('auth_token')
    const res = await fetch(`/api/templates/prompts/${tpl.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      ElMessage.success(t('ai.promptManager.deleteSuccess'))
      await fetchTemplates()
    } else {
      ElMessage.error(t('ai.promptManager.deleteFailed'))
    }
  } catch {}
}

function handleSaved() {
  fetchTemplates()
}

onMounted(fetchTemplates)
</script>

<style scoped>
.prompt-template-manager {
  padding: 0;
}
.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.manager-header h3 {
  margin: 0;
  font-size: 16px;
}
.template-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.template-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.template-item:hover {
  border-color: var(--el-color-primary-light-5);
}
.template-item.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.template-info {
  flex: 1;
  min-width: 0;
}
.template-name {
  font-weight: 500;
  margin-bottom: 4px;
}
.template-meta {
  margin-bottom: 4px;
}
.template-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.template-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  margin-left: 12px;
}
.loading-state,
.empty-state {
  text-align: center;
  padding: 24px;
  color: var(--el-text-color-secondary);
}
.prompt-preview h4 {
  margin: 0 0 8px;
}
.preview-desc {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  margin: 0 0 12px;
}
.preview-content {
  background: var(--el-fill-color-light);
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 400px;
  overflow-y: auto;
  margin: 0;
}
</style>
