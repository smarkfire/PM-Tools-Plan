import type { Message } from '~/server/utils/ai/types'
import { buildSystemPrompt } from '~/server/utils/ai/context-builder'
import { callAIStream, createSSEStream } from '~/server/utils/ai/stream'
import { isAIAvailable } from '~/server/utils/ai/fallback'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { messages, projectContext, extraPrompt, locale } = body

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

  const systemPrompt = buildSystemPrompt(project, tasks, extraPrompt, locale)

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
