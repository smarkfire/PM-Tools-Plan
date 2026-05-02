import { parseUserAction, validateAction } from '~/server/utils/ai/action-parser'
import { isAIAvailable } from '~/server/utils/ai/fallback'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { input, tasks } = body

  if (!input || typeof input !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'input is required'
    })
  }

  if (!tasks || !Array.isArray(tasks)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid tasks format'
    })
  }

  if (!isAIAvailable()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'AI 服务未配置'
    })
  }

  const action = await parseUserAction(input, tasks)

  if (!action) {
    return {
      success: false,
      message: '抱歉，我无法理解您的操作意图。请尝试更明确的描述，例如：\n- "把需求分析分配给张三"\n- "把设计阶段的工期改为10天"\n- "把接口开发标记为已完成"'
    }
  }

  const validation = validateAction(action, tasks)
  if (!validation.valid) {
    return {
      success: false,
      message: validation.error
    }
  }

  return {
    success: true,
    action,
    requiresConfirmation: true
  }
})
