import type { Message } from '~/server/utils/ai/types'
import type { AITaskType } from '~/server/utils/ai/router'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { messages, taskType } = body

  if (!messages || !Array.isArray(messages)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid messages format'
    })
  }

  if (!taskType) {
    throw createError({
      statusCode: 400,
      statusMessage: 'taskType is required'
    })
  }

  const providerOptions = selectAIProvider(taskType as AITaskType)

  const response = await callAIWithRetry(messages as Message[], providerOptions)

  return response
})
