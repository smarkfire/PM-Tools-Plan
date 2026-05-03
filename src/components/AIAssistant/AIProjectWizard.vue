<template>
  <el-dialog
    v-model="dialogVisible"
    :title="t('ai.wizard.title')"
    width="900px"
    :close-on-click-modal="false"
  >
    <div class="wizard-steps">
      <div
        v-for="(step, index) in steps"
        :key="index"
        class="step-item"
        :class="{
          active: currentStep === index,
          completed: currentStep > index
        }"
      >
        <div class="step-number">{{ index + 1 }}</div>
        <div class="step-title">{{ step }}</div>
      </div>
    </div>

    <div class="wizard-content">
      <div v-show="currentStep === 0" class="step-panel">
        <el-alert
          v-if="!aiAvailable"
          :title="t('ai.status.notConfigured')"
          type="warning"
          show-icon
          :closable="false"
          class="mb-4"
        >
          <template #default>
            <p>{{ t('ai.status.notConfiguredDesc') }}</p>
          </template>
        </el-alert>

        <div class="step-header">
          <span class="step-form-title">{{ t('ai.wizard.step1') }}</span>
          <el-button
            v-if="aiAvailable"
            type="primary"
            text
            class="ai-quick-btn"
            @click="quickInputRef?.show()"
          >
            <i class="fa fa-magic"></i>
            {{ t('ai.quickInput.trigger') }}
          </el-button>
        </div>

        <el-form :model="form" label-width="100px">
          <el-form-item :label="t('ai.wizard.projectName')">
            <el-input
              v-model="form.projectName"
              :placeholder="t('ai.wizard.projectNamePlaceholder')"
            />
          </el-form-item>
          <el-form-item :label="t('ai.wizard.projectStartDate')">
            <el-date-picker
              v-model="form.startDate"
              type="date"
              :placeholder="t('ai.wizard.projectStartDatePlaceholder')"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item :label="t('ai.wizard.projectEndDate')">
            <el-date-picker
              v-model="form.endDate"
              type="date"
              :placeholder="t('ai.wizard.projectEndDatePlaceholder')"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item :label="t('ai.wizard.projectDesc')">
            <el-input
              v-model="form.projectDescription"
              type="textarea"
              :rows="3"
              :placeholder="t('ai.wizard.projectDescPlaceholder')"
            />
          </el-form-item>
          <el-form-item :label="t('ai.wizard.industry')">
            <el-select v-model="form.industry" :placeholder="t('ai.wizard.industryPlaceholder')">
              <el-option :label="t('ai.wizard.industrySoftware')" value="software" />
              <el-option :label="t('ai.wizard.industryMarketing')" value="marketing" />
              <el-option :label="t('ai.wizard.industryConstruction')" value="construction" />
              <el-option :label="t('ai.wizard.industryOther')" value="other" />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('ai.wizard.teamMembers')">
            <div class="team-members-input">
              <div v-for="(member, index) in form.teamMembers" :key="index" class="member-row">
                <el-input
                  v-model="member.name"
                  :placeholder="t('ai.wizard.memberNamePlaceholder')"
                  style="width: 30%"
                />
                <el-input
                  v-model="member.role"
                  :placeholder="t('ai.wizard.memberRolePlaceholder')"
                  style="width: 30%"
                />
                <el-input
                  v-model="member.email"
                  :placeholder="t('ai.wizard.memberEmailPlaceholder')"
                  style="width: 30%"
                />
                <el-button
                  type="danger"
                  text
                  @click="form.teamMembers.splice(index, 1)"
                >
                  <el-icon><ElIconDelete /></el-icon>
                </el-button>
              </div>
              <el-button type="primary" text @click="addTeamMember">
                <el-icon><ElIconPlus /></el-icon>
                {{ t('ai.wizard.addMember') }}
              </el-button>
            </div>
          </el-form-item>
          <el-form-item :label="t('ai.wizard.requirements')">
            <el-input
              v-model="form.requirements"
              type="textarea"
              :rows="2"
              :placeholder="t('ai.wizard.requirementsPlaceholder')"
            />
          </el-form-item>
        </el-form>
      </div>

      <div v-show="currentStep === 1" class="step-panel">
        <h3>{{ t('ai.template.selectTitle') }}</h3>
        <AITemplateSelector @select="handleTemplateSelect" @open-market="showMarket = true" />
        <el-divider />
        <div class="template-actions">
          <el-button @click="skipTemplate">
            {{ t('ai.template.skip') }}
          </el-button>
          <el-button type="primary" @click="startGeneration" :disabled="!aiAvailable">
            {{ t('ai.wizard.next') }}
          </el-button>
        </div>
      </div>

      <div v-show="currentStep === 2" class="step-panel">
        <div v-if="generating" class="generating-state">
          <el-icon class="is-loading" :size="60">
            <ElIconLoading />
          </el-icon>
          <h3>{{ t('ai.wizard.generating') }}</h3>
          <p>{{ generatingStatus }}</p>
          <el-progress
            :percentage="generatingProgress"
            :status="generatingProgress === 100 ? 'success' : undefined"
          />
        </div>
        <div v-else class="generating-state">
          <el-icon :size="60" color="#f56c6c">
            <ElIconCircleClose />
          </el-icon>
          <h3>{{ t('ai.wizard.generateFailed') }}</h3>
          <p>{{ errorMessage }}</p>
          <el-button type="primary" @click="currentStep = 1">
            {{ t('ai.wizard.previous') }}
          </el-button>
        </div>
      </div>

      <div v-show="currentStep === 3" class="step-panel">
        <div class="statistics">
          <div class="stat-item">
            <div class="stat-value">{{ statistics.totalTasks }}</div>
            <div class="stat-label">{{ t('ai.wizard.statTotalTasks') }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ statistics.estimatedDuration }}</div>
            <div class="stat-label">{{ t('ai.wizard.statEstimatedDuration') }}（{{ t('ai.wizard.statDurationUnit') }}）</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ statistics.criticalPathCount }}</div>
            <div class="stat-label">{{ t('ai.wizard.statCriticalPath') }}（{{ t('ai.wizard.statCriticalPathUnit') }}）</div>
          </div>
        </div>

        <el-divider />

        <div class="task-tree-container">
          <TaskTreeNode :tasks="generatedTasks" />
        </div>

        <div v-if="aiUsage" class="ai-usage-info">
          <el-divider />
          <div class="usage-header">
            <i class="fa fa-robot" />
            <span>{{ t('ai.wizard.usageTitle') }}</span>
          </div>
          <div class="usage-details">
            <div class="usage-item">
              <span class="usage-label">{{ t('ai.wizard.usageModel') }}</span>
              <span class="usage-value">{{ aiUsage.provider }} / {{ aiUsage.model }}</span>
            </div>
            <div class="usage-item">
              <span class="usage-label">{{ t('ai.wizard.usagePromptTokens') }}</span>
              <span class="usage-value">{{ aiUsage.promptTokens.toLocaleString() }}</span>
            </div>
            <div class="usage-item">
              <span class="usage-label">{{ t('ai.wizard.usageCompletionTokens') }}</span>
              <span class="usage-value">{{ aiUsage.completionTokens.toLocaleString() }}</span>
            </div>
            <div class="usage-item">
              <span class="usage-label">{{ t('ai.wizard.usageTotalTokens') }}</span>
              <span class="usage-value usage-highlight">{{ aiUsage.totalTokens.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="wizard-footer">
        <el-button
          v-if="currentStep === 1"
          @click="currentStep = 0"
        >
          {{ t('ai.wizard.previous') }}
        </el-button>

        <el-button
          v-if="currentStep === 3"
          @click="currentStep = 2"
        >
          {{ t('ai.wizard.previous') }}
        </el-button>

        <el-button
          v-if="currentStep === 0"
          type="primary"
          @click="currentStep = 1"
          :disabled="!canNextStep"
        >
          {{ t('ai.wizard.next') }}
        </el-button>

        <el-button
          v-if="currentStep === 3"
          @click="dialogVisible = false"
        >
          {{ t('ai.wizard.cancel') }}
        </el-button>

        <el-button
          v-if="currentStep === 3"
          type="primary"
          @click="handleImport"
          :loading="importing"
        >
          {{ t('ai.wizard.importToProject') }}
        </el-button>
      </div>
    </template>
    <AIQuickInputDialog ref="quickInputRef" @parsed="handleQuickInputParsed" />

    <el-dialog v-model="showMarket" :title="$t('ai.market.title')" width="800px" append-to-body>
      <TemplateMarket @apply-project="handleMarketApply" @import-prompt="handleMarketPrompt" />
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { useTasksStore } from '~/store/tasks'
import { useProjectStore } from '~/store/project'
import { useAuthStore } from '~/store/auth'
import TemplateMarket from './TemplateMarket.vue'
import type { IndustryTemplate } from '~/data/templates'

const { t } = useI18n()
const tasksStore = useTasksStore()
const projectStore = useProjectStore()
const authStore = useAuthStore()
const { aiAvailable } = useAIAvailability()

const dialogVisible = defineModel<boolean>({ default: false })
const showMarket = ref(false)

const currentStep = ref(0)
const importing = ref(false)
const generating = ref(false)
const generatingProgress = ref(0)
const generatingStatus = ref('')
const errorMessage = ref('')

const steps = computed(() => [
  t('ai.wizard.step1'),
  t('ai.wizard.step2'),
  t('ai.wizard.step3'),
  t('ai.wizard.step4')
])

interface TeamMemberInput {
  name: string
  role: string
  email: string
}

const form = ref({
  projectName: '',
  startDate: '',
  endDate: '',
  projectDescription: '',
  industry: '',
  requirements: '',
  teamMembers: [] as TeamMemberInput[],
  selectedTemplate: null as IndustryTemplate | null
})

const generatedTasks = ref<any[]>([])
const statistics = ref({
  totalTasks: 0,
  estimatedDuration: 0,
  criticalPathCount: 0
})
const aiUsage = ref<{
  model: string
  provider: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
} | null>(null)

const quickInputRef = ref()

const handleQuickInputParsed = (data: {
  projectName: string
  startDate: string
  endDate: string
  description: string
  industry: string
  teamMembers: Array<{ name: string; role: string; email: string }>
  requirements: string
}) => {
  if (data.projectName) form.value.projectName = data.projectName
  if (data.startDate) form.value.startDate = data.startDate
  if (data.endDate) form.value.endDate = data.endDate
  if (data.description) form.value.projectDescription = data.description
  if (data.industry) form.value.industry = data.industry
  if (data.requirements) form.value.requirements = data.requirements
  if (data.teamMembers && data.teamMembers.length > 0) {
    form.value.teamMembers = data.teamMembers
  }
}

const canNextStep = computed(() => {
  return !!form.value.projectName && !!form.value.projectDescription
})

const addTeamMember = () => {
  form.value.teamMembers.push({ name: '', role: '', email: '' })
}

const handleTemplateSelect = (template: IndustryTemplate) => {
  form.value.selectedTemplate = template
}

const handleMarketApply = (project: any) => {
  showMarket.value = false
  ElMessage.success(t('projectTemplate.projectCreated'))
}

const handleMarketPrompt = (tpl: any) => {
  showMarket.value = false
  ElMessage.success(t('ai.market.importSuccess', { name: tpl.name }))
}

const skipTemplate = () => {
  form.value.selectedTemplate = null
  startGeneration()
}

const startGeneration = async () => {
  currentStep.value = 2
  generating.value = true
  generatingProgress.value = 0
  generatingStatus.value = t('ai.wizard.generatingAnalyzing')
  errorMessage.value = ''

  try {
    generatingProgress.value = 10
    generatingStatus.value = t('ai.wizard.generatingDecomposing')

    await new Promise(r => setTimeout(r, 500))
    generatingProgress.value = 30

    const memberNames = form.value.teamMembers
      .filter(m => m.name.trim())
      .map(m => m.name.trim())

    const response = await $fetch('/api/ai/wbs', {
      method: 'POST',
      headers: authStore.getAuthHeaders(),
      body: {
        projectName: form.value.projectName,
        projectDescription: form.value.projectDescription,
        startDate: form.value.startDate,
        endDate: form.value.endDate,
        industry: form.value.industry,
        requirements: form.value.requirements,
        teamMembers: memberNames,
        template: form.value.selectedTemplate
      }
    }) as any

    generatingProgress.value = 60
    generatingStatus.value = t('ai.wizard.generatingCalculating')

    await new Promise(r => setTimeout(r, 500))
    generatingProgress.value = 80

    generatedTasks.value = response.tasks || []
    statistics.value = response.statistics || { totalTasks: 0, estimatedDuration: 0, criticalPathCount: 0 }
    aiUsage.value = response.usage || null

    generatingProgress.value = 100
    generatingStatus.value = t('ai.wizard.generatingDone')

    await new Promise(r => setTimeout(r, 800))
    currentStep.value = 3
  } catch (error: any) {
    console.error('Task generation error:', error)
    generating.value = false
    if (error?.statusCode === 503) {
      errorMessage.value = t('ai.status.notConfigured')
    } else {
      errorMessage.value = error?.data?.message || t('ai.wizard.generateFailed')
    }
  }
}

const importTaskRecursive = (tasks: any[], parentId: string | null = null) => {
  for (const task of tasks) {
    const addedTask = tasksStore.addTask({
      name: task.name || '',
      startDate: task.startDate || '',
      endDate: task.endDate || '',
      duration: task.duration || 1,
      deliverable: task.deliverable || '',
      description: task.description || '',
      assignee: task.assignee || '',
      priority: task.priority || t('common.priority.medium'),
      status: task.status || t('common.status.todo'),
      dependencies: task.dependencies || [],
      parentId
    })

    if (task.children && Array.isArray(task.children) && task.children.length > 0) {
      importTaskRecursive(task.children, addedTask.id)
    }
  }
}

const handleImport = async () => {
  importing.value = true

  try {
    tasksStore.clearTasks()
    projectStore.clearProject()

    projectStore.setProjectInfo({
      name: form.value.projectName,
      startDate: form.value.startDate || '',
      endDate: form.value.endDate || '',
      description: form.value.projectDescription
    })

    for (const member of form.value.teamMembers) {
      if (member.name.trim()) {
        projectStore.addMember({
          name: member.name.trim(),
          role: member.role.trim(),
          email: member.email.trim()
        })
      }
    }

    importTaskRecursive(generatedTasks.value)

    tasksStore.expandAll()

    ElMessage.success(t('ai.wizard.importSuccess', { count: statistics.value.totalTasks }))
    resetForm()
    dialogVisible.value = false
  } catch (error) {
    console.error('Task import error:', error)
    ElMessage.error(t('ai.wizard.importFailed'))
  } finally {
    importing.value = false
  }
}

const resetForm = () => {
  currentStep.value = 0
  form.value = {
    projectName: '',
    startDate: '',
    endDate: '',
    projectDescription: '',
    industry: '',
    requirements: '',
    teamMembers: [],
    selectedTemplate: null
  }
  generatedTasks.value = []
  statistics.value = { totalTasks: 0, estimatedDuration: 0, criticalPathCount: 0 }
  aiUsage.value = null
  generatingProgress.value = 0
  generatingStatus.value = ''
  generating.value = false
  errorMessage.value = ''
}

watch(dialogVisible, (val) => {
  if (!val) {
    resetForm()
  }
})
</script>

<style scoped>
.wizard-steps {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding: 0 2rem;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.5;
}

.step-item.active {
  opacity: 1;
}

.step-item.completed {
  opacity: 1;
  color: #67c23a;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid currentColor;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.step-item.active .step-number {
  background: #409eff;
  color: white;
  border-color: #409eff;
}

.step-item.completed .step-number {
  background: #67c23a;
  color: white;
  border-color: #67c23a;
}

.step-title {
  font-size: 0.85rem;
}

.wizard-content {
  min-height: 400px;
  padding: 0 2rem;
}

.step-panel h3 {
  margin-bottom: 1.5rem;
  color: #303133;
}

.step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.step-form-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.ai-quick-btn {
  font-size: 13px;
  padding: 4px 8px;
}

.ai-quick-btn i {
  margin-right: 4px;
  color: #667eea;
}

.team-members-input {
  width: 100%;
}

.member-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  align-items: center;
}

.template-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.generating-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 1.5rem;
}

.statistics {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: #f5f7fa;
  border-radius: 8px;
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #409eff;
}

.stat-label {
  font-size: 0.85rem;
  color: #909399;
  margin-top: 0.25rem;
}

.task-tree-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.wizard-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.ai-usage-info {
  margin-top: 0.5rem;
}

.usage-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #606266;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.usage-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem 2rem;
  background: #fafafa;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}

.usage-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
}

.usage-label {
  color: #909399;
  font-size: 0.8rem;
}

.usage-value {
  color: #303133;
  font-size: 0.85rem;
  font-weight: 500;
}

.usage-highlight {
  color: #409eff;
  font-weight: 700;
  font-size: 0.95rem;
}
</style>
