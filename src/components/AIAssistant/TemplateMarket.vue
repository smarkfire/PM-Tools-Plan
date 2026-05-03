<template>
  <div class="template-market">
    <div class="market-header">
      <h3>{{ $t('ai.market.title') }}</h3>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane :label="$t('ai.market.projectTemplates')" name="projects">
        <div v-if="loading" class="loading-state">{{ $t('common.messages.loading') }}</div>
        <div v-else-if="marketData.projects.length === 0" class="empty-state">{{ $t('ai.market.noProjects') }}</div>
        <div v-else>
          <div v-for="industry in marketData.projectIndustries" :key="industry" class="category-section">
            <h4 class="category-title">{{ industry }}</h4>
            <div class="template-grid">
              <div
                v-for="tpl in getProjectsByIndustry(industry)"
                :key="tpl.id"
                class="market-card"
              >
                <div class="card-icon">{{ tpl.icon || '📋' }}</div>
                <div class="card-name">{{ tpl.name }}</div>
                <div class="card-desc">{{ tpl.description }}</div>
                <div class="card-info">
                  <span>{{ (tpl.phases || []).length }} {{ $t('ai.market.phases') }}</span>
                  <span>{{ getTotalTasks(tpl) }} {{ $t('ai.market.tasks') }}</span>
                  <span>{{ tpl.usageCount || 0 }} {{ $t('ai.market.usages') }}</span>
                </div>
                <el-button type="primary" size="small" class="apply-btn" @click="handleApplyProject(tpl)">
                  {{ $t('ai.market.apply') }}
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane :label="$t('ai.market.promptTemplates')" name="prompts">
        <div v-if="loading" class="loading-state">{{ $t('common.messages.loading') }}</div>
        <div v-else-if="marketData.prompts.length === 0" class="empty-state">{{ $t('ai.market.noPrompts') }}</div>
        <div v-else>
          <div v-for="cat in marketData.promptCategories" :key="cat" class="category-section">
            <h4 class="category-title">{{ categoryLabel(cat) }}</h4>
            <div class="template-grid">
              <div
                v-for="tpl in getPromptsByCategory(cat)"
                :key="tpl.id"
                class="market-card"
              >
                <div class="card-name">{{ tpl.name }}</div>
                <div class="card-desc">{{ tpl.description }}</div>
                <el-tag size="small" type="info" style="margin-bottom: 8px">{{ categoryLabel(tpl.category) }}</el-tag>
                <div class="card-actions-row">
                  <el-button size="small" @click="previewPrompt(tpl)">{{ $t('ai.market.preview') }}</el-button>
                  <el-button type="primary" size="small" @click="handleImportPrompt(tpl)">{{ $t('ai.market.import') }}</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const emit = defineEmits(['apply-project', 'import-prompt'])

const loading = ref(false)
const activeTab = ref('projects')
const previewVisible = ref(false)
const previewData = ref(null)

const marketData = reactive({
  prompts: [],
  projects: [],
  promptCategories: [],
  projectIndustries: [],
})

function categoryLabel(cat) {
  const map = {
    general: t('ai.promptEditor.categoryGeneral'),
    industry: t('ai.promptEditor.categoryIndustry'),
    report: t('ai.promptEditor.categoryReport'),
    chat: t('ai.promptEditor.categoryChat'),
  }
  return map[cat] || cat
}

function getTotalTasks(tpl) {
  return (tpl.phases || []).reduce((sum, p) => sum + (p.tasks || []).length, 0)
}

function getProjectsByIndustry(industry) {
  return marketData.projects.filter(p => p.industry === industry)
}

function getPromptsByCategory(cat) {
  return marketData.prompts.filter(p => p.category === cat)
}

function previewPrompt(tpl) {
  previewData.value = tpl
  previewVisible.value = true
}

async function handleApplyProject(tpl) {
  try {
    await ElMessageBox.confirm(
      t('ai.market.applyConfirm', { name: tpl.name }),
      t('ai.market.applyTitle'),
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
      ElMessage.success(t('ai.market.applySuccess'))
      emit('apply-project', project)
    } else {
      ElMessage.error(t('ai.market.applyFailed'))
    }
  } catch {}
}

function handleImportPrompt(tpl) {
  emit('import-prompt', tpl)
  ElMessage.success(t('ai.market.importSuccess', { name: tpl.name }))
}

async function fetchMarket() {
  loading.value = true
  try {
    const token = localStorage.getItem('auth_token')
    const res = await fetch('/api/templates/market', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      Object.assign(marketData, data)
    }
  } catch (e) {
    console.error('Failed to fetch market:', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchMarket)
</script>

<style scoped>
.template-market { padding: 0; }
.market-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.market-header h3 { margin: 0; font-size: 16px; }
.category-section { margin-bottom: 20px; }
.category-title {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0 0 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.market-card {
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  transition: all 0.2s;
}
.market-card:hover {
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
.card-actions-row {
  display: flex;
  gap: 8px;
  width: 100%;
}
.card-actions-row .el-button { flex: 1; }
.loading-state, .empty-state {
  text-align: center;
  padding: 24px;
  color: var(--el-text-color-secondary);
}
.prompt-preview h4 { margin: 0 0 8px; }
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
