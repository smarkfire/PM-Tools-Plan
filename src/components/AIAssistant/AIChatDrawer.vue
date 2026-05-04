<template>
  <el-drawer
    v-model="chatStore.isOpen"
    :title="t('ai.chat.title')"
    direction="rtl"
    :size="drawerWidth + 'px'"
    :show-close="true"
    :before-close="handleClose"
    class="ai-chat-drawer"
  >
    <template #header>
      <div class="drawer-header">
        <div class="header-title">
          <el-icon color="#667eea"><ChatDotRound /></el-icon>
          <span>{{ t('ai.chat.title') }}</span>
        </div>
        <div class="header-actions">
          <el-select
            v-model="selectedPromptId"
            :placeholder="$t('ai.promptEditor.name')"
            size="small"
            clearable
            style="width: 140px; margin-right: 8px"
            @change="handlePromptChange"
          >
            <el-option
              v-for="pt in promptTemplates"
              :key="pt.id"
              :label="pt.name"
              :value="pt.id"
            />
          </el-select>
          <el-tooltip :content="$t('ai.promptManager.manageBtn')" placement="bottom">
            <el-button text size="small" @click="showPromptManager = true">
              <i class="fa fa-cog"></i>
            </el-button>
          </el-tooltip>
          <el-button text size="small" @click="handleNewSession">
            <el-icon><Plus /></el-icon>
          </el-button>
          <el-button text size="small" @click="handleClearHistory">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
    </template>

    <div
      class="resize-handle"
      @mousedown="startResize"
    >
      <div class="resize-line"></div>
    </div>

    <div class="chat-container">
      <AIChatMessages
        :messages="chatStore.currentMessages"
        :loading="loading"
        @quick-question="handleQuickQuestion"
      />
      <AIChatInput
        ref="chatInputRef"
        :loading="loading"
        @send="handleSend"
      />
    </div>

    <AIActionConfirm
      ref="actionConfirmRef"
      :action="pendingAction"
      :project-data="buildProjectContext().project"
      :tasks="buildProjectContext().tasks"
      @confirmed="handleActionConfirmed"
      @cancelled="handleActionCancelled"
    />

    <AIReportDialog ref="reportDialogRef" />

    <el-dialog v-model="showPromptManager" :title="$t('ai.promptManager.manageBtn')" width="700px" append-to-body>
      <PromptTemplateManager @select="handlePromptFromManager" />
    </el-dialog>
  </el-drawer>
</template>

<script setup lang="ts">
import { ChatDotRound, Plus, Delete } from '@element-plus/icons-vue'
import { useChatStore } from '~/store/chat'
import { useProjectStore } from '~/store/project'
import { useTasksStore } from '~/store/tasks'
import { useAuthStore } from '~/store/auth'
import { flattenTasks } from '~/utils/wbs'
import PromptTemplateManager from './PromptTemplateManager.vue'

const { t, locale } = useI18n()
const chatStore = useChatStore()
const projectStore = useProjectStore()
const tasksStore = useTasksStore()
const authStore = useAuthStore()

const loading = ref(false)
const chatInputRef = ref()
const actionConfirmRef = ref()
const pendingAction = ref<any>(null)
const reportDialogRef = ref()
const promptTemplates = ref<any[]>([])
const selectedPromptId = ref<string | null>(null)
const activePromptContent = ref<string | null>(null)
const showPromptManager = ref(false)

const MIN_WIDTH = 320
const MAX_WIDTH = 800
const DEFAULT_WIDTH = 400
const STORAGE_KEY = 'ai-chat-drawer-width'

const drawerWidth = ref(DEFAULT_WIDTH)

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    const w = parseInt(saved, 10)
    if (w >= MIN_WIDTH && w <= MAX_WIDTH) {
      drawerWidth.value = w
    }
  }

  chatStore.loadFromLocalStorage()
  if (!chatStore.currentSessionId && chatStore.sessions.length === 0) {
    chatStore.createSession()
  }

  fetchPromptTemplates()
})

async function fetchPromptTemplates() {
  try {
    const token = authStore.accessToken
    if (!token) return
    const res = await fetch('/api/templates/prompts', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      promptTemplates.value = await res.json()
    }
  } catch {
    // silently fail
  }
}

function handlePromptChange(id: string | null) {
  if (!id) {
    activePromptContent.value = null
    return
  }
  const tpl = promptTemplates.value.find(p => p.id === id)
  if (tpl) {
    activePromptContent.value = tpl.systemPrompt
  }
}

function handlePromptFromManager(tpl: any) {
  showPromptManager.value = false
  if (tpl?.systemPrompt) {
    activePromptContent.value = tpl.systemPrompt
    selectedPromptId.value = tpl.id
  }
  fetchPromptTemplates()
}

const startResize = (e: MouseEvent) => {
  e.preventDefault()
  const startX = e.clientX
  const startWidth = drawerWidth.value

  const onMouseMove = (moveEvent: MouseEvent) => {
    const delta = startX - moveEvent.clientX
    const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta))
    drawerWidth.value = newWidth
  }

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    localStorage.setItem(STORAGE_KEY, String(drawerWidth.value))
  }

  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

const buildProjectContext = () => {
  const flatTasks = flattenTasks(tasksStore.tasks)
  return {
    project: {
      name: projectStore.project.name,
      startDate: projectStore.project.startDate,
      endDate: projectStore.project.endDate,
      description: projectStore.project.description,
      members: projectStore.project.members || []
    },
    tasks: flatTasks.map(t => ({
      id: t.id,
      name: t.name,
      status: t.status,
      priority: t.priority,
      assignee: t.assignee,
      startDate: t.startDate,
      endDate: t.endDate,
      duration: t.duration
    }))
  }
}

const handleSend = async (text: string) => {
  if (!text.trim() || loading.value) return

  const isAction = await tryExecuteAction(text)
  if (isAction) return

  chatStore.addMessage('user', text)
  loading.value = true

  chatStore.addMessage('assistant', '')

  try {
    const messages = chatStore.currentMessages
      .filter(m => m.role === 'user' || (m.role === 'assistant' && m.content))
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }))

    const response = await fetch('/api/ai/chat-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authStore.accessToken ? { Authorization: `Bearer ${authStore.accessToken}` } : {}),
      },
      body: JSON.stringify({
        messages,
        projectContext: buildProjectContext(),
        extraPrompt: activePromptContent.value,
        locale: locale.value
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No reader available')

    const decoder = new TextDecoder()
    let fullContent = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue

        const data = trimmed.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          if (parsed.error) {
            fullContent += `\n\n❌ ${parsed.error}`
            chatStore.updateLastAssistantMessage(fullContent)
          } else if (parsed.content) {
            fullContent += parsed.content
            chatStore.updateLastAssistantMessage(fullContent)
          }
        } catch {
          // skip malformed chunks
        }
      }
    }
  } catch (error: any) {
    chatStore.updateLastAssistantMessage(
      t('ai.chat.errorMessage')
    )
  } finally {
    loading.value = false
    chatStore.saveToLocalStorage()
  }
}

const handleQuickQuestion = (question: string) => {
  const reportKeywords: Record<string, { type: 'weekly' | 'monthly' | 'milestone' | 'review'; match: string }> = {
    'weekly': { type: 'weekly', match: t('ai.report.weeklyTitle') },
    'monthly': { type: 'monthly', match: t('ai.report.monthlyTitle') },
    'milestone': { type: 'milestone', match: t('ai.report.milestoneTitle') },
    'review': { type: 'review', match: t('ai.report.reviewTitle') }
  }

  for (const [, config] of Object.entries(reportKeywords)) {
    if (question.includes(config.match)) {
      const ctx = buildProjectContext()
      reportDialogRef.value?.generateReport(config.type, ctx.project, ctx.tasks)
      return
    }
  }

  handleSend(question)
}

const handleNewSession = () => {
  chatStore.createSession()
}

const handleClearHistory = () => {
  chatStore.clearHistory()
}

const handleClose = (done: () => void) => {
  chatStore.setOpen(false)
  done()
}

const tryExecuteAction = async (text: string) => {
  const ctx = buildProjectContext()
  try {
    const result = await $fetch('/api/ai/execute-action', {
      method: 'POST',
      headers: authStore.getAuthHeaders(),
      body: {
        input: text,
        tasks: ctx.tasks
      }
    })

    if (result.success && result.requiresConfirmation) {
      pendingAction.value = result.action
      nextTick(() => {
        actionConfirmRef.value?.show()
      })
      return true
    }
  } catch {
    // not an action, continue as normal chat
  }
  return false
}

const handleActionConfirmed = (result: any) => {
  if (result.success) {
    chatStore.addMessage('assistant', `✅ ${result.message}`)
    ElMessage.success(result.message)
  } else {
    chatStore.addMessage('assistant', `❌ ${result.message}`)
    ElMessage.error(result.message)
  }
  pendingAction.value = null
}

const handleActionCancelled = () => {
  chatStore.addMessage('assistant', t('ai.action.cancelled'))
  pendingAction.value = null
}
</script>

<style scoped>
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.resize-handle {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resize-handle:hover .resize-line,
.resize-handle:active .resize-line {
  background: #667eea;
  opacity: 1;
}

.resize-line {
  width: 3px;
  height: 32px;
  border-radius: 2px;
  background: var(--el-border-color);
  opacity: 0.4;
  transition: all 0.2s;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  margin: -20px 0;
}

.ai-chat-drawer :deep(.el-drawer__body) {
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}
</style>
