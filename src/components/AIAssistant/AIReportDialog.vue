<template>
  <el-dialog
    v-model="visible"
    :title="reportTitle"
    width="700px"
    class="report-dialog"
    destroy-on-close
  >
    <div v-if="generating" class="report-generating">
      <el-icon :size="32" class="generating-icon"><Loading /></el-icon>
      <p>{{ t('ai.wizard.generating') }}</p>
    </div>
    <div v-else-if="reportContent" class="report-content">
      <div class="report-stats">
        <el-tag v-for="(stat, key) in reportStats" :key="key" effect="plain" size="small">
          {{ stat.label }}: {{ stat.value }}
        </el-tag>
      </div>
      <div class="markdown-body" v-html="renderMarkdown(reportContent)"></div>
    </div>
    <div v-else class="report-empty">
      <p>{{ t('common.messages.noData') }}</p>
    </div>

    <template #footer>
      <el-button @click="handleCopy" :disabled="!reportContent">
        <el-icon><DocumentCopy /></el-icon>
        {{ t('ai.report.exportCopy') }}
      </el-button>
      <el-button type="primary" @click="handleExportMarkdown" :disabled="!reportContent">
        <el-icon><Download /></el-icon>
        {{ t('ai.report.exportMarkdown') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { Loading, DocumentCopy, Download } from '@element-plus/icons-vue'
import { Marked } from 'marked'

const { t } = useI18n()

const visible = ref(false)
const generating = ref(false)
const reportTitle = ref('')
const reportContent = ref('')
const reportStats = ref<Record<string, { label: string; value: string | number }>>({})

const marked = new Marked({ gfm: true, breaks: true })

const renderMarkdown = (content: string) => {
  if (!content) return ''
  try {
    return marked.parse(content) as string
  } catch {
    return content.replace(/\n/g, '<br>')
  }
}

type ReportType = 'weekly' | 'monthly' | 'milestone' | 'review'

const generateReport = async (type: ReportType, projectData: any, tasks: any[]) => {
  visible.value = true
  generating.value = true
  reportContent.value = ''
  reportStats.value = {}

  const titleMap: Record<ReportType, string> = {
    weekly: t('ai.report.weeklyTitle'),
    monthly: t('ai.report.monthlyTitle'),
    milestone: t('ai.report.milestoneTitle'),
    review: t('ai.report.reviewTitle')
  }

  const apiMap: Record<ReportType, string> = {
    weekly: '/api/ai/generate-weekly-report',
    monthly: '/api/ai/generate-monthly-report',
    milestone: '/api/ai/generate-milestone-summary',
    review: '/api/ai/generate-project-review'
  }

  reportTitle.value = titleMap[type]

  try {
    const result = await $fetch<any>(apiMap[type], {
      method: 'POST',
      body: { project: projectData, tasks }
    })

    reportTitle.value = result.title || titleMap[type]
    reportContent.value = result.content

    if (result.statistics) {
      const stats: Record<string, { label: string; value: string | number }> = {}
      if (result.statistics.totalTasks !== undefined) stats.total = { label: '总任务', value: result.statistics.totalTasks }
      if (result.statistics.completedTasks !== undefined) stats.completed = { label: '已完成', value: result.statistics.completedTasks }
      if (result.statistics.progress !== undefined) stats.progress = { label: '进度', value: result.statistics.progress + '%' }
      if (result.statistics.delayedTasks !== undefined) stats.delayed = { label: '延期', value: result.statistics.delayedTasks }
      reportStats.value = stats
    }

    ElMessage.success(t('ai.report.generateSuccess'))
  } catch (error: any) {
    ElMessage.error(t('ai.report.generateFailed') + ': ' + (error.message || '未知错误'))
  } finally {
    generating.value = false
  }
}

const handleCopy = () => {
  if (!reportContent.value) return
  navigator.clipboard.writeText(reportContent.value)
  ElMessage.success('已复制到剪贴板')
}

const handleExportMarkdown = () => {
  if (!reportContent.value) return
  const blob = new Blob([reportContent.value], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${reportTitle.value}.md`
  a.click()
  URL.revokeObjectURL(url)
}

defineExpose({ generateReport })
</script>

<style scoped>
.report-generating {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  color: var(--el-text-color-secondary);
}

.generating-icon {
  animation: spin 1s linear infinite;
  color: #667eea;
  margin-bottom: 12px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.report-stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.report-content {
  max-height: 60vh;
  overflow-y: auto;
  padding: 0 4px;
}

.report-empty {
  text-align: center;
  padding: 48px 0;
  color: var(--el-text-color-secondary);
}
</style>
