<template>
  <transition name="drawer">
    <div
      v-if="chatStore.isOpen"
      class="ai-chat-drawer"
      :style="{ width: drawerWidth + 'px' }"
    >
      <div
        class="resize-handle"
        @mousedown="startResize"
      >
        <div class="resize-line"></div>
      </div>

      <div class="drawer-header">
        <div class="header-left">
          <el-icon :size="20" style="color: #667eea;"><Cpu /></el-icon>
          <span class="title">{{ t('ai.chat.title') }}</span>
        </div>
        <div class="header-actions">
          <el-button text size="small" @click="handleNewChat">
            <el-icon><Plus /></el-icon>
          </el-button>
          <el-button text size="small" @click="handleClearHistory">
            <el-icon><Delete /></el-icon>
          </el-button>
          <el-button text size="small" @click="chatStore.setOpen(false)">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>

      <AIChatMessages
        :messages="chatStore.currentMessages"
        :loading="isLoading"
        @quick-action="handleQuickAction"
      />

      <AIChatInput
        ref="chatInputRef"
        :loading="isLoading"
        @send="handleSend"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { Cpu, Plus, Delete, Close } from '@element-plus/icons-vue'
import { useChatStore } from '~/store/chat'

const { t } = useI18n()
const chatStore = useChatStore()

const isLoading = ref(false)
const chatInputRef = ref()

const MIN_WIDTH = 320
const MAX_WIDTH = 800
const DEFAULT_WIDTH = 400
const STORAGE_KEY = 'ai-chat-drawer-width'

const drawerWidth = ref(DEFAULT_WIDTH)

onMounted(() => {
  chatStore.loadFromLocalStorage()
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    const w = parseInt(saved, 10)
    if (w >= MIN_WIDTH && w <= MAX_WIDTH) {
      drawerWidth.value = w
    }
  }
})

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

const getProjectContext = () => {
  try {
    const projectStore = useProjectStore()
    const taskStore = useTaskStore()
    return {
      project: {
        name: projectStore.projectInfo?.name || '',
        startDate: projectStore.projectInfo?.startDate || '',
        endDate: projectStore.projectInfo?.endDate || '',
        description: projectStore.projectInfo?.description || '',
        members: projectStore.projectInfo?.members || []
      },
      tasks: (taskStore.tasks || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        priority: t.priority,
        assignee: t.assignee || '',
        startDate: t.startDate || '',
        endDate: t.endDate || '',
        duration: t.duration || 0
      }))
    }
  } catch {
    return { project: { name: '', startDate: '', endDate: '', description: '', members: [] }, tasks: [] }
  }
}

const handleSend = async (text: string) => {
  if (!chatStore.currentSessionId) {
    chatStore.createSession()
  }

  chatStore.addMessage('user', text)
  isLoading.value = true

  try {
    const messages = chatStore.currentMessages.map(m => ({
      role: m.role,
      content: m.content
    }))

    const projectContext = getProjectContext()

    const response = await fetch('/api/ai/chat-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, projectContext })
    })

    if (!response.ok) {
      const errorText = await response.text()
      chatStore.addMessage('assistant', `错误: ${errorText}`)
      isLoading.value = false
      return
    }

    chatStore.addMessage('assistant', '')
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      chatStore.addMessage('assistant', '无法读取响应流')
      isLoading.value = false
      return
    }

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
          if (parsed.content) {
            fullContent += parsed.content
            chatStore.updateLastAssistantMessage(fullContent)
          }
          if (parsed.error) {
            fullContent += `\n\n错误: ${parsed.error}`
            chatStore.updateLastAssistantMessage(fullContent)
          }
        } catch {
          // skip malformed chunks
        }
      }
    }

    chatStore.saveToLocalStorage()
  } catch (error: any) {
    chatStore.addMessage('assistant', `请求失败: ${error.message}`)
  } finally {
    isLoading.value = false
  }
}

const handleQuickAction = (key: string) => {
  const actionMap: Record<string, string> = {
    progress: t('ai.chat.quickProgressQuery'),
    risk: t('ai.chat.quickRiskQuery'),
    workload: t('ai.chat.quickWorkloadQuery'),
    suggestion: t('ai.chat.quickSuggestionQuery')
  }
  const query = actionMap[key]
  if (query) {
    handleSend(query)
  }
}

const handleNewChat = () => {
  chatStore.createSession()
  nextTick(() => {
    chatInputRef.value?.focus()
  })
}

const handleClearHistory = () => {
  chatStore.clearHistory()
}
</script>

<style scoped>
.ai-chat-drawer {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  background: var(--el-bg-color);
  border-left: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  z-index: 1999;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.08);
}

.resize-handle {
  position: absolute;
  left: 0;
  top: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.resize-handle:hover .resize-line,
.resize-handle:active .resize-line {
  background: var(--el-color-primary);
  opacity: 0.8;
}

.resize-line {
  width: 2px;
  height: 40px;
  border-radius: 1px;
  background: var(--el-border-color);
  opacity: 0.5;
  transition: all 0.2s;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-left .title {
  font-size: 15px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}
</style>
