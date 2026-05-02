import type { Message } from '~/server/utils/ai/types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { messages, provider, model } = body

  if (!messages || !Array.isArray(messages)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid messages format'
    })
  }

  const response = await callAI(messages as Message[], {
    provider: provider || 'deepseek',
    model: model || undefined
  })

  return response
})
