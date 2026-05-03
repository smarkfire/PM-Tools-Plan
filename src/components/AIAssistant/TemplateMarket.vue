<template>
  <div class="template-market">
    <div class="market-header">
      <h3>模板市场</h3>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="项目计划模板" name="projects">
        <div v-if="loading" class="loading-state">加载中...</div>
        <div v-else-if="marketData.projects.length === 0" class="empty-state">暂无官方项目模板</div>
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
                  <span>{{ (tpl.phases || []).length }} 个阶段</span>
                  <span>{{ getTotalTasks(tpl) }} 个任务</span>
                  <span>{{ tpl.usageCount || 0 }} 次使用</span>
                </div>
                <el-button type="primary" size="small" class="apply-btn" @click="handleApplyProject(tpl)">
                  应用模板
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Prompt 模板" name="prompts">
        <div v-if="loading" class="loading-state">加载中...</div>
        <div v-else-if="marketData.prompts.length === 0" class="empty-state">暂无官方 Prompt 模板</div>
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
                  <el-button size="small" @click="previewPrompt(tpl)">预览</el-button>
                  <el-button type="primary" size="small" @click="handleImportPrompt(tpl)">导入</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="previewVisible" title="Prompt 预览" width="600px">
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

const categoryMap = { general: '通用', industry: '行业专家', report: '报告生成', chat: '对话助手' }
function categoryLabel(cat) { return categoryMap[cat] || cat }

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
      emit('apply-project', project)
    } else {
      ElMessage.error('应用失败')
    }
  } catch {}
}

function handleImportPrompt(tpl) {
  emit('import-prompt', tpl)
  ElMessage.success(`已选择 Prompt 模板「${tpl.name}」`)
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
