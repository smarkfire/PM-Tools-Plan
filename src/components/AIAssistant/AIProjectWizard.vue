<template>
  <el-dialog
    v-model="dialogVisible"
    :title="t('ai.wizard.title')"
    width="900px"
    :close-on-click-modal="false"
    destroy-on-close
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

        <el-form :model="form" label-width="100px">
          <el-form-item :label="t('ai.wizard.projectName')">
            <el-input
              v-model="form.projectName"
              :placeholder="t('ai.wizard.projectNamePlaceholder')"
            />
          </el-form-item>
          <el-form-item :label="t('ai.wizard.projectDesc')">
            <el-input
              v-model="form.projectDescription"
              type="textarea"
              :rows="4"
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
        <AITemplateSelector @select="handleTemplateSelect" />
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
  </el-dialog>
</template>

<script setup lang="ts">
import { useTasksStore } from '~/store/tasks'
import type { IndustryTemplate } from '~/data/templates'

const { t } = useI18n()
const tasksStore = useTasksStore()
const { aiAvailable } = useAIAvailability()

const dialogVisible = defineModel<boolean>({ default: false })

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

const form = ref({
  projectName: '',
  projectDescription: '',
  industry: '',
  requirements: '',
  selectedTemplate: null as IndustryTemplate | null
})

const generatedTasks = ref<any[]>([])
const statistics = ref({
  totalTasks: 0,
  estimatedDuration: 0,
  criticalPathCount: 0
})

const canNextStep = computed(() => {
  return !!form.value.projectName && !!form.value.projectDescription
})

const handleTemplateSelect = (template: IndustryTemplate) => {
  form.value.selectedTemplate = template
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

    const response = await $fetch('/api/ai/wbs', {
      method: 'POST',
      body: {
        projectDescription: form.value.projectDescription,
        industry: form.value.industry,
        requirements: form.value.requirements,
        template: form.value.selectedTemplate
      }
    }) as any

    generatingProgress.value = 60
    generatingStatus.value = t('ai.wizard.generatingCalculating')

    await new Promise(r => setTimeout(r, 500))
    generatingProgress.value = 80

    generatedTasks.value = response.tasks || []
    statistics.value = response.statistics || { totalTasks: 0, estimatedDuration: 0, criticalPathCount: 0 }

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

const flattenTasks = (tasks: any[], parentId: string | null = null): any[] => {
  const result: any[] = []
  for (const task of tasks) {
    const taskData = {
      name: task.name,
      duration: task.duration || 1,
      deliverable: task.deliverable || '',
      description: task.description || '',
      parentId,
      dependencies: task.dependencies || []
    }
    result.push(taskData)
    if (task.children && Array.isArray(task.children)) {
      const parent = result[result.length - 1]
      result.push(...flattenTasks(task.children, parent.name))
    }
  }
  return result
}

const handleImport = async () => {
  importing.value = true

  try {
    const flatTasks = flattenTasks(generatedTasks.value)
    for (const task of flatTasks) {
      tasksStore.addTask(task)
    }

    ElMessage.success(t('ai.wizard.importSuccess', { count: statistics.value.totalTasks }))
    dialogVisible.value = false
    resetForm()
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
    projectDescription: '',
    industry: '',
    requirements: '',
    selectedTemplate: null
  }
  generatedTasks.value = []
  statistics.value = { totalTasks: 0, estimatedDuration: 0, criticalPathCount: 0 }
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
</style>
