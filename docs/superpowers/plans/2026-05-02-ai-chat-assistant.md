# AI 问答助手实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 为 PLAN-Tools 添加 AI 问答助手，用户可通过浮动按钮打开侧边抽屉聊天界面，与 AI 进行项目相关的对话交互，支持流式响应和项目状态查询。

**架构：** 浮动按钮 + 侧边抽屉交互模式。前端通过 Pinia store 管理对话历史，发送请求时自动附带项目上下文。后端新增 SSE 流式聊天 API 和项目分析 API，复用现有 AI client 调用 Deepseek。

**技术栈：** Vue 3 + Element Plus + Pinia + Nuxt 3 Server Routes + SSE (Server-Sent Events) + Deepseek API

---

## 文件结构

| 操作 | 文件路径 | 职责 |
|------|---------|------|
| 创建 | `src/components/AIAssistant/AIFloatingButton.vue` | 右下角浮动按钮 |
| 创建 | `src/components/AIAssistant/AIChatDrawer.vue` | 侧边抽屉聊天容器 |
| 创建 | `src/components/AIAssistant/AIChatMessages.vue` | 消息列表渲染 |
| 创建 | `src/components/AIAssistant/AIChatInput.vue` | 输入框组件 |
| 创建 | `src/store/chat.js` | 对话历史 Pinia store |
| 创建 | `src/server/utils/ai/context-builder.ts` | 项目上下文构建器 |
| 创建 | `src/server/utils/ai/stream.ts` | 流式响应工具 |
| 创建 | `src/server/api/ai/chat-stream.post.ts` | SSE 流式聊天 API |
| 创建 | `src/server/api/ai/analyze-delay-risk.post.ts` | 延期风险分析 API |
| 创建 | `src/server/api/ai/analyze-workload.post.ts` | 成员负载分析 API |
| 创建 | `src/server/api/ai/health-diagnosis.post.ts` | 项目健康诊断 API |
| 修改 | `src/pages/workspace.vue` | 集成浮动按钮和抽屉 |
| 修改 | `i18n/locales/zh-CN.json` | 添加 AI 聊天相关中文翻译 |
| 修改 | `i18n/locales/en.json` | 添加 AI 聊天相关英文翻译 |

---

### 任务 1：创建对话历史 Pinia Store

**文件：**
- 创建：`src/store/chat.js`

- [ ] **步骤 1：创建 chat store**

```javascript
import { defineStore } from 'pinia'

const STORAGE_KEY = 'plan-tools-chat'
const MAX_MESSAGES_PER_SESSION = 100

export const useChatStore = defineStore('chat', {
  state: () => ({
    sessions: [],
    currentSessionId: null,
    isOpen: false
  }),

  getters: {
    currentSession: (state) => {
      if (!state.currentSessionId) return null
      return state.sessions.find(s => s.id === state.currentSessionId)
    },

    currentMessages: (state) => {
      const session = state.sessions.find(s => s.id === state.currentSessionId)
      if (!session) return []
      return session.messages
    },

    hasUnread: (state) => {
      return false
    }
  },

  actions: {
    generateId() {
      return `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },

    createSession() {
      const session = {
        id: this.generateId(),
        title: '新对话',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      this.sessions.unshift(session)
      this.currentSessionId = session.id
      this.saveToLocalStorage()
      return session
    },

    addMessage(role, content) {
      if (!this.currentSessionId) {
        this.createSession()
      }
      const session = this.sessions.find(s => s.id === this.currentSessionId)
      if (session) {
        session.messages.push({
          role,
          content,
          timestamp: new Date().toISOString()
        })
        if (session.messages.length > MAX_MESSAGES_PER_SESSION) {
          session.messages = session.messages.slice(-MAX_MESSAGES_PER_SESSION)
        }
        if (role === 'user' && session.messages.filter(m => m.role === 'user').length === 1) {
          session.title = content.substring(0, 20) + (content.length > 20 ? '...' : '')
        }
        session.updatedAt = new Date().toISOString()
        this.saveToLocalStorage()
      }
    },

    updateLastAssistantMessage(content) {
      const session = this.sessions.find(s => s.id === this.currentSessionId)
      if (session && session.messages.length > 0) {
        const lastMsg = session.messages[session.messages.length - 1]
        if (lastMsg.role === 'assistant') {
          lastMsg.content = content
        }
      }
    },

    clearHistory() {
      const session = this.sessions.find(s => s.id === this.currentSessionId)
      if (session) {
        session.messages = []
        session.updatedAt = new Date().toISOString()
        this.saveToLocalStorage()
      }
    },

    toggleOpen() {
      this.isOpen = !this.isOpen
    },

    setOpen(value) {
      this.isOpen = value
    },

    saveToLocalStorage() {
      try {
        const data = {
          sessions: this.sessions,
          currentSessionId: this.currentSessionId
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch (error) {
        console.error('Failed to save chat to localStorage:', error)
      }
    },

    loadFromLocalStorage() {
      try {
        const data = localStorage.getItem(STORAGE_KEY)
        if (data) {
          const parsed = JSON.parse(data)
          this.sessions = parsed.sessions || []
          this.currentSessionId = parsed.currentSessionId || null
        }
      } catch (error) {
        console.error('Failed to load chat from localStorage:', error)
      }
    }
  }
})
```

- [ ] **步骤 2：Commit**

```bash
git add src/store/chat.js
git commit -m "feat: add chat Pinia store for AI assistant"
```

---

### 任务 2：创建项目上下文构建器

**文件：**
- 创建：`src/server/utils/ai/context-builder.ts`

- [ ] **步骤 1：创建 context-builder**

```typescript
interface ProjectContext {
  name: string
  startDate: string
  endDate: string
  description: string
  members: Array<{ id: string; name: string; role: string }>
}

interface TaskSummary {
  id: string
  name: string
  status: string
  priority: string
  assignee: string
  startDate: string
  endDate: string
  duration: number
  progress: number
}

export function buildSystemPrompt(
  project: ProjectContext,
  tasks: TaskSummary[]
): string {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === '已完成').length
  const inProgressTasks = tasks.filter(t => t.status === '进行中').length
  const todoTasks = tasks.filter(t => t.status === '待办').length
  const highPriorityTasks = tasks.filter(t => t.priority === '高')

  const now = new Date()
  const delayedTasks = tasks.filter(t => {
    if (!t.endDate || t.status === '已完成') return false
    return new Date(t.endDate) < now
  })

  const memberNames = project.members?.map(m => m.name).join('、') || '无'

  const taskListStr = tasks.slice(0, 30).map((t, i) =>
    `${i + 1}. ${t.name} | 状态:${t.status} | 优先级:${t.priority} | 负责人:${t.assignee || '未分配'} | 工期:${t.duration}天 | ${t.startDate || ''}~${t.endDate || ''}`
  ).join('\n')

  const moreTasksNote = tasks.length > 30 ? `\n...还有${tasks.length - 30}个任务未显示` : ''

  return `你是 PLAN-Tools 的 AI 项目管理助手。你可以帮助用户查询项目状态、分析风险、提供建议。

当前项目信息:
- 项目名称: ${project.name || '未命名项目'}
- 计划开始日期: ${project.startDate || '未设置'}
- 计划结束日期: ${project.endDate || '未设置'}
- 项目描述: ${project.description || '无'}
- 团队成员: ${memberNames}

任务统计:
- 总任务数: ${totalTasks}
- 已完成: ${completedTasks}
- 进行中: ${inProgressTasks}
- 待办: ${todoTasks}
- 高优先级: ${highPriorityTasks.length}个
- 已延期: ${delayedTasks.length}个

任务列表(前30个):
${taskListStr}${moreTasksNote}

回答要求:
1. 用简洁、友好的中文回答
2. 涉及具体任务时，引用任务名称
3. 给出建议时要有可操作性
4. 如果数据不足以判断，请说明
5. 使用 Markdown 格式让回答更易读（加粗、列表等）`
}
```

- [ ] **步骤 2：Commit**

```bash
git add src/server/utils/ai/context-builder.ts
git commit -m "feat: add AI context builder for project-aware chat"
```

---

### 任务 3：创建流式响应工具

**文件：**
- 创建：`src/server/utils/ai/stream.ts`

- [ ] **步骤 1：创建 stream 工具**

```typescript
import type { Message, AIProviderOptions } from './types'

interface StreamChunk {
  choices: Array<{
    delta: { content?: string }
    finish_reason?: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function callAIStream(
  messages: Message[],
  options?: AIProviderOptions
): Promise<ReadableStream<Uint8Array>> {
  const config = useRuntimeConfig()

  const baseURL = config.deepseekApiBase || 'https://api.deepseek.com'
  const apiKey = config.deepseekApiKey
  const model = options?.model || config.deepseekModel || 'deepseek-chat'

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Deepseek API Key not configured'
    })
  }

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
      stream: true
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw createError({
      statusCode: response.status,
      statusMessage: `Deepseek API error: ${errorText}`
    })
  }

  return response.body as ReadableStream<Uint8Array>
}

export function createSSEStream(
  aiStream: ReadableStream<Uint8Array>
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let buffer = ''

  return new ReadableStream({
    async start(controller) {
      const reader = aiStream.getReader()

      try {
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
            if (data === '[DONE]') {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              continue
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content || ''
              if (content) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                )
              }
            } catch {
              // skip malformed chunks
            }
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (error: any) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
        )
        controller.close()
      }
    }
  })
}
```

- [ ] **步骤 2：Commit**

```bash
git add src/server/utils/ai/stream.ts
git commit -m "feat: add AI stream utility for SSE responses"
```

---

### 任务 4：创建 SSE 流式聊天 API

**文件：**
- 创建：`src/server/api/ai/chat-stream.post.ts`

- [ ] **步骤 1：创建 chat-stream API**

```typescript
import type { Message } from '~/server/utils/ai/types'
import { buildSystemPrompt } from '~/server/utils/ai/context-builder'
import { callAIStream, createSSEStream } from '~/server/utils/ai/stream'
import { isAIAvailable } from '~/server/utils/ai/fallback'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { messages, projectContext } = body

  if (!messages || !Array.isArray(messages)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid messages format'
    })
  }

  if (!isAIAvailable()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'AI 服务未配置'
    })
  }

  const project = projectContext?.project || {
    name: '', startDate: '', endDate: '', description: '', members: []
  }
  const tasks = projectContext?.tasks || []

  const systemPrompt = buildSystemPrompt(project, tasks)

  const allMessages: Message[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m: Message) => ({
      role: m.role,
      content: m.content
    }))
  ]

  const aiStream = await callAIStream(allMessages, {
    provider: 'deepseek',
    maxTokens: 2000
  })

  const sseStream = createSSEStream(aiStream)

  setResponseHeader(event, 'Content-Type', 'text/event-stream')
  setResponseHeader(event, 'Cache-Control', 'no-cache')
  setResponseHeader(event, 'Connection', 'keep-alive')

  return sendStream(event, sseStream)
})
```

- [ ] **步骤 2：Commit**

```bash
git add src/server/api/ai/chat-stream.post.ts
git commit -m "feat: add SSE streaming chat API endpoint"
```

---

### 任务 5：创建项目分析 API（延期风险、成员负载、健康诊断）

**文件：**
- 创建：`src/server/api/ai/analyze-delay-risk.post.ts`
- 创建：`src/server/api/ai/analyze-workload.post.ts`
- 创建：`src/server/api/ai/health-diagnosis.post.ts`

- [ ] **步骤 1：创建延期风险分析 API**

```typescript
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { tasks } = body

  if (!tasks || !Array.isArray(tasks)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid tasks format'
    })
  }

  const now = new Date()

  const delayed = tasks.filter((t: any) => {
    if (!t.endDate || t.status === '已完成') return false
    return new Date(t.endDate) < now
  }).map((t: any) => ({
    id: t.id,
    name: t.name,
    endDate: t.endDate,
    assignee: t.assignee || '未分配',
    overdueDays: Math.ceil((now.getTime() - new Date(t.endDate).getTime()) / (1000 * 60 * 60 * 24))
  }))

  const atRisk = tasks.filter((t: any) => {
    if (!t.endDate || t.status === '已完成') return false
    const endDate = new Date(t.endDate)
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysRemaining > 0 && daysRemaining <= 3
  }).map((t: any) => ({
    id: t.id,
    name: t.name,
    endDate: t.endDate,
    assignee: t.assignee || '未分配',
    daysRemaining: Math.ceil((new Date(t.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }))

  return { delayed, atRisk }
})
```

- [ ] **步骤 2：创建成员负载分析 API**

```typescript
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { tasks, members } = body

  if (!tasks || !Array.isArray(tasks)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid tasks format'
    })
  }

  const memberList = members || []
  const workload = memberList.map((member: any) => {
    const memberTasks = tasks.filter((t: any) =>
      t.assignee === member.name && t.status !== '已完成'
    )

    const totalHours = memberTasks.reduce((sum: number, t: any) => {
      return sum + (t.duration || 0) * 8
    }, 0)

    return {
      memberId: member.id,
      memberName: member.name,
      memberRole: member.role || '',
      taskCount: memberTasks.length,
      totalHours,
      loadPercentage: Math.min(totalHours / 40 * 100, 100),
      status: totalHours > 50 ? '过载' : totalHours > 30 ? '正常' : '空闲',
      tasks: memberTasks.map((t: any) => ({
        id: t.id,
        name: t.name,
        duration: t.duration,
        priority: t.priority,
        status: t.status
      }))
    }
  })

  const unassignedTasks = tasks.filter((t: any) =>
    !t.assignee && t.status !== '已完成'
  )

  return { workload, unassignedCount: unassignedTasks.length }
})
```

- [ ] **步骤 3：创建健康诊断 API**

```typescript
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { project, tasks } = body

  if (!tasks || !Array.isArray(tasks)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid tasks format'
    })
  }

  const now = new Date()

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t: any) => t.status === '已完成').length
  const progress = totalTasks > 0 ? completedTasks / totalTasks * 100 : 100

  let progressScore = 100
  if (project?.startDate && project?.endDate) {
    const startDate = new Date(project.startDate)
    const endDate = new Date(project.endDate)
    const totalDuration = endDate.getTime() - startDate.getTime()
    const elapsed = now.getTime() - startDate.getTime()
    if (totalDuration > 0) {
      const expectedProgress = Math.min(elapsed / totalDuration * 100, 100)
      progressScore = progress >= expectedProgress ? 100 : Math.max(0, 100 - (expectedProgress - progress) * 2)
    }
  }
  progressScore = Math.round(progressScore)

  const assigneeCounts = new Map<string, number>()
  tasks.forEach((t: any) => {
    if (t.assignee) {
      assigneeCounts.set(t.assignee, (assigneeCounts.get(t.assignee) || 0) + 1)
    }
  })
  let resourceScore = 100
  if (assigneeCounts.size > 0) {
    const counts = Array.from(assigneeCounts.values())
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length
    const variance = counts.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) / counts.length
    resourceScore = Math.round(Math.max(0, 100 - variance * 5))
  }

  let riskCount = 0
  tasks.forEach((task: any) => {
    if (!task.endDate || task.status === '已完成') return
    const endDate = new Date(task.endDate)
    if (endDate < now) {
      riskCount += 10
    } else {
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysRemaining <= 3) {
        riskCount += 5
      }
    }
  })
  const riskScore = Math.max(0, 100 - riskCount)

  const overallScore = Math.round((progressScore + resourceScore + riskScore) / 3)

  const getScoreStatus = (score: number) => {
    if (score >= 90) return '优秀'
    if (score >= 75) return '良好'
    if (score >= 60) return '正常'
    return '需关注'
  }

  const recommendations: string[] = []
  if (progressScore < 70) {
    recommendations.push('项目进度落后于预期，建议增加资源或调整工期')
  }
  if (resourceScore < 70) {
    recommendations.push('团队成员负载不均衡，建议重新分配任务')
  }
  if (riskScore < 70) {
    const delayedCount = tasks.filter((t: any) => {
      if (!t.endDate || t.status === '已完成') return false
      return new Date(t.endDate) < now
    }).length
    if (delayedCount > 0) {
      recommendations.push(`有${delayedCount}个任务已延期，建议优先处理`)
    }
  }
  if (recommendations.length === 0) {
    recommendations.push('项目状态良好，继续保持当前节奏')
  }

  return {
    overallScore,
    dimensions: {
      progress: { score: progressScore, status: getScoreStatus(progressScore) },
      resources: { score: resourceScore, status: getScoreStatus(resourceScore) },
      risks: { score: riskScore, status: getScoreStatus(riskScore) }
    },
    recommendations,
    statistics: {
      totalTasks,
      completedTasks,
      progress: Math.round(progress)
    }
  }
})
```

- [ ] **步骤 4：Commit**

```bash
git add src/server/api/ai/analyze-delay-risk.post.ts src/server/api/ai/analyze-workload.post.ts src/server/api/ai/health-diagnosis.post.ts
git commit -m "feat: add project analysis APIs (delay risk, workload, health diagnosis)"
```

---

### 任务 6：创建 AIFloatingButton 组件

**文件：**
- 创建：`src/components/AIAssistant/AIFloatingButton.vue`

- [ ] **步骤 1：创建浮动按钮组件**

```vue
<template>
  <div class="ai-float-button" :class="{ active: isOpen }" @click="handleClick">
    <el-icon :size="24">
      <ChatDotRound />
    </el-icon>
    <div class="tooltip">{{ t('ai.chat.tooltip') }}</div>
  </div>
</template>

<script setup lang="ts">
import { ChatDotRound } from '@element-plus/icons-vue'
import { useChatStore } from '~/store/chat'

const { t } = useI18n()
const chatStore = useChatStore()

const isOpen = computed(() => chatStore.isOpen)

const handleClick = () => {
  chatStore.toggleOpen()
}
</script>

<style scoped>
.ai-float-button {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  z-index: 2000;
}

.ai-float-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.6);
}

.ai-float-button.active {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

.tooltip {
  position: absolute;
  right: 64px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.ai-float-button:hover .tooltip {
  opacity: 1;
}
</style>
```

- [ ] **步骤 2：Commit**

```bash
git add src/components/AIAssistant/AIFloatingButton.vue
git commit -m "feat: add AI floating button component"
```

---

### 任务 7：创建 AIChatInput 组件

**文件：**
- 创建：`src/components/AIAssistant/AIChatInput.vue`

- [ ] **步骤 1：创建输入框组件**

```vue
<template>
  <div class="chat-input">
    <el-input
      ref="inputRef"
      v-model="inputText"
      type="textarea"
      :rows="2"
      :placeholder="t('ai.chat.inputPlaceholder')"
      resize="none"
      @keydown.enter.exact.prevent="handleSend"
    />
    <el-button
      type="primary"
      :icon="Promotion"
      :loading="loading"
      :disabled="!inputText.trim()"
      @click="handleSend"
    >
      {{ t('ai.chat.send') }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { Promotion } from '@element-plus/icons-vue'

const props = defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  send: [text: string]
}>()

const { t } = useI18n()
const inputText = ref('')
const inputRef = ref()

const handleSend = () => {
  const text = inputText.value.trim()
  if (!text || props.loading) return
  emit('send', text)
  inputText.value = ''
  nextTick(() => {
    inputRef.value?.focus()
  })
}

defineExpose({
  focus: () => inputRef.value?.focus()
})
</script>

<style scoped>
.chat-input {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.chat-input :deep(.el-textarea__inner) {
  font-size: 14px;
}

.chat-input .el-button {
  align-self: flex-end;
}
</style>
```

- [ ] **步骤 2：Commit**

```bash
git add src/components/AIAssistant/AIChatInput.vue
git commit -m "feat: add AI chat input component"
```

---

### 任务 8：创建 AIChatMessages 组件

**文件：**
- 创建：`src/components/AIAssistant/AIChatMessages.vue`

- [ ] **步骤 1：创建消息列表组件**

```vue
<template>
  <div ref="messagesRef" class="chat-messages">
    <div v-if="messages.length === 0" class="welcome-message">
      <div class="welcome-avatar">
        <el-icon :size="36" color="#667eea"><ChatDotRound /></el-icon>
      </div>
      <div class="welcome-content">
        <h4>{{ t('ai.chat.welcomeTitle') }}</h4>
        <p>{{ t('ai.chat.welcomeDesc') }}</p>
        <ul>
          <li>📊 {{ t('ai.chat.featureQuery') }}</li>
          <li>📅 {{ t('ai.chat.featureProgress') }}</li>
          <li>⚠️ {{ t('ai.chat.featureRisk') }}</li>
          <li>💡 {{ t('ai.chat.featureSuggest') }}</li>
        </ul>
        <p class="quick-label">{{ t('ai.chat.quickQuestions') }}</p>
        <div class="quick-questions">
          <el-tag
            v-for="question in quickQuestions"
            :key="question"
            effect="plain"
            class="quick-tag"
            @click="emit('quickQuestion', question)"
          >
            {{ question }}
          </el-tag>
        </div>
      </div>
    </div>

    <div
      v-for="(message, index) in messages"
      :key="index"
      class="message-item"
      :class="message.role"
    >
      <div class="message-avatar">
        <el-icon v-if="message.role === 'user'" :size="16"><User /></el-icon>
        <el-icon v-else :size="16" color="#667eea"><ChatDotRound /></el-icon>
      </div>
      <div class="message-content">
        <div class="message-text" v-html="formatMessage(message.content)"></div>
        <div class="message-time">{{ formatTime(message.timestamp) }}</div>
      </div>
    </div>

    <div v-if="loading" class="typing-indicator">
      <div class="typing-avatar">
        <el-icon :size="16" color="#667eea"><ChatDotRound /></el-icon>
      </div>
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChatDotRound, User } from '@element-plus/icons-vue'

const props = defineProps<{
  messages: Array<{ role: string; content: string; timestamp: string }>
  loading: boolean
}>()

const emit = defineEmits<{
  quickQuestion: [question: string]
}>()

const { t } = useI18n()
const messagesRef = ref<HTMLElement>()

const quickQuestions = computed(() => [
  t('ai.chat.quickDelay'),
  t('ai.chat.quickHealth'),
  t('ai.chat.quickWorkload'),
  t('ai.chat.quickRisk')
])

watch(() => props.messages.length, () => {
  scrollToBottom()
})

watch(() => {
  if (props.messages.length > 0) {
    return props.messages[props.messages.length - 1].content
  }
  return ''
}, () => {
  scrollToBottom()
})

onMounted(() => {
  scrollToBottom()
})

const scrollToBottom = async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

const formatMessage = (content: string) => {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

const formatTime = (timestamp: string) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.welcome-message {
  text-align: center;
  padding: 24px 16px;
}

.welcome-avatar {
  margin-bottom: 12px;
}

.welcome-content h4 {
  margin: 0 0 8px;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.welcome-content p {
  margin: 4px 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.welcome-content ul {
  list-style: none;
  padding: 0;
  margin: 12px 0;
  text-align: left;
  display: inline-block;
}

.welcome-content ul li {
  font-size: 13px;
  padding: 2px 0;
  color: var(--el-text-color-regular);
}

.quick-label {
  margin-top: 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.quick-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 8px;
}

.quick-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.quick-tag:hover {
  color: #667eea;
  border-color: #667eea;
}

.message-item {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--el-fill-color-light);
}

.message-item.user .message-avatar {
  background: #667eea;
  color: white;
}

.message-content {
  max-width: 80%;
}

.message-text {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.message-item.assistant .message-text {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.message-item.user .message-text {
  background: #667eea;
  color: white;
}

.message-item.user .message-text :deep(code) {
  background: rgba(255, 255, 255, 0.2);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 13px;
}

.message-item.assistant .message-text :deep(code) {
  background: var(--el-fill-color);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 13px;
}

.message-time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-top: 4px;
}

.message-item.user .message-time {
  text-align: right;
}

.typing-indicator {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
}

.typing-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
}

.typing-dots {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
  animation: typing 1.4s infinite both;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
```

- [ ] **步骤 2：Commit**

```bash
git add src/components/AIAssistant/AIChatMessages.vue
git commit -m "feat: add AI chat messages component with welcome screen"
```

---

### 任务 9：创建 AIChatDrawer 组件

**文件：**
- 创建：`src/components/AIAssistant/AIChatDrawer.vue`

- [ ] **步骤 1：创建侧边抽屉聊天容器**

```vue
<template>
  <el-drawer
    v-model="chatStore.isOpen"
    :title="t('ai.chat.title')"
    direction="rtl"
    size="400px"
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
          <el-button text size="small" @click="handleNewSession">
            <el-icon><Plus /></el-icon>
          </el-button>
          <el-button text size="small" @click="handleClearHistory">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
    </template>

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
  </el-drawer>
</template>

<script setup lang="ts">
import { ChatDotRound, Plus, Delete } from '@element-plus/icons-vue'
import { useChatStore } from '~/store/chat'
import { useProjectStore } from '~/store/project'
import { useTasksStore } from '~/store/tasks'
import { flattenTasks } from '~/utils/wbs'

const { t } = useI18n()
const chatStore = useChatStore()
const projectStore = useProjectStore()
const tasksStore = useTasksStore()

const loading = ref(false)
const chatInputRef = ref()

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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        projectContext: buildProjectContext()
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
      `抱歉，我遇到了一些问题：${error.message || '未知错误'}。请稍后再试。`
    )
  } finally {
    loading.value = false
    chatStore.saveToLocalStorage()
  }
}

const handleQuickQuestion = (question: string) => {
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

onMounted(() => {
  chatStore.loadFromLocalStorage()
  if (!chatStore.currentSessionId && chatStore.sessions.length === 0) {
    chatStore.createSession()
  }
})
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
}
</style>
```

- [ ] **步骤 2：Commit**

```bash
git add src/components/AIAssistant/AIChatDrawer.vue
git commit -m "feat: add AI chat drawer with streaming support"
```

---

### 任务 10：集成到 workspace 页面

**文件：**
- 修改：`src/pages/workspace.vue`

- [ ] **步骤 1：在 workspace.vue 中引入 AI 聊天组件**

在 `<script setup>` 部分添加导入：

```javascript
import AIFloatingButton from '~/components/AIAssistant/AIFloatingButton.vue'
import AIChatDrawer from '~/components/AIAssistant/AIChatDrawer.vue'
```

在模板最后 `</div>` 之前（`<AIProjectWizard>` 之后）添加：

```vue
    <AIFloatingButton />
    <AIChatDrawer />
```

- [ ] **步骤 2：Commit**

```bash
git add src/pages/workspace.vue
git commit -m "feat: integrate AI chat assistant into workspace"
```

---

### 任务 11：添加 i18n 翻译

**文件：**
- 修改：`i18n/locales/zh-CN.json`
- 修改：`i18n/locales/en.json`

- [ ] **步骤 1：在 zh-CN.json 的 `ai` 对象中添加 `chat` 字段**

在 `ai.wizard` 之后、`ai` 对象闭合之前添加：

```json
    "chat": {
      "title": "AI 助手",
      "tooltip": "AI 助手",
      "welcomeTitle": "你好！我是 PLAN-Tools AI 助手",
      "welcomeDesc": "我可以帮你管理项目，回答项目相关问题",
      "featureQuery": "查询项目状态",
      "featureProgress": "分析任务进度",
      "featureRisk": "预警延期风险",
      "featureSuggest": "提供优化建议",
      "quickQuestions": "试试问我：",
      "quickDelay": "哪些任务可能延期？",
      "quickHealth": "项目健康度如何？",
      "quickWorkload": "团队成员工作负载如何？",
      "quickRisk": "帮我分析项目风险",
      "inputPlaceholder": "输入您的问题... (Enter 发送)",
      "send": "发送",
      "newSession": "新对话",
      "clearHistory": "清空对话",
      "errorMessage": "抱歉，我遇到了一些问题。请稍后再试。"
    }
```

- [ ] **步骤 2：在 en.json 的 `ai` 对象中添加 `chat` 字段**

在 `ai.wizard` 之后、`ai` 对象闭合之前添加：

```json
    "chat": {
      "title": "AI Assistant",
      "tooltip": "AI Assistant",
      "welcomeTitle": "Hello! I'm PLAN-Tools AI Assistant",
      "welcomeDesc": "I can help you manage projects and answer project-related questions",
      "featureQuery": "Query project status",
      "featureProgress": "Analyze task progress",
      "featureRisk": "Alert delay risks",
      "featureSuggest": "Provide optimization suggestions",
      "quickQuestions": "Try asking me:",
      "quickDelay": "Which tasks might be delayed?",
      "quickHealth": "How is the project health?",
      "quickWorkload": "How is the team workload?",
      "quickRisk": "Help me analyze project risks",
      "inputPlaceholder": "Type your question... (Enter to send)",
      "send": "Send",
      "newSession": "New Chat",
      "clearHistory": "Clear History",
      "errorMessage": "Sorry, I encountered an issue. Please try again later."
    }
```

- [ ] **步骤 3：Commit**

```bash
git add i18n/locales/zh-CN.json i18n/locales/en.json
git commit -m "feat: add i18n translations for AI chat assistant"
```

---

### 任务 12：端到端验证

**文件：** 无新文件

- [ ] **步骤 1：启动开发服务器**

运行：`npm run dev`
预期：服务器正常启动，无编译错误

- [ ] **步骤 2：验证浮动按钮**

- 打开 workspace 页面
- 确认右下角显示浮动按钮
- 点击按钮，确认侧边抽屉打开

- [ ] **步骤 3：验证聊天功能**

- 在聊天界面输入问题
- 确认消息发送成功
- 确认 AI 流式回复逐字显示
- 确认快捷问题可点击

- [ ] **步骤 4：验证项目上下文**

- 确保项目有数据（项目信息 + 任务）
- 询问"项目健康度如何？"
- 确认 AI 回复包含当前项目信息

- [ ] **步骤 5：验证持久化**

- 刷新页面
- 确认对话历史保留

- [ ] **步骤 6：Commit 最终验证**

```bash
git add -A
git commit -m "feat: complete AI chat assistant (Week 5-6 core)"
```
