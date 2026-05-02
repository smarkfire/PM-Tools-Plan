export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { taskDescription, complexity, teamSkills } = body

  if (!taskDescription) {
    throw createError({
      statusCode: 400,
      statusMessage: '任务描述不能为空'
    })
  }

  if (!isAIAvailable()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'AI 服务未配置，请先在 .env 文件中配置 API Key'
    })
  }

  const systemPrompt = `你是一个项目管理专家，擅长估算任务工期。请使用PERT（计划评审技术）方法估算任务工期。

PERT公式:
- 乐观工期(O): 最快完成时间
- 最可能工期(M): 正常情况下完成时间
- 悲观工期(P): 最慢完成时间
- 期望工期 = (O + 4M + P) / 6

请根据任务描述、复杂度（1-5级）和团队能力，返回三种工期估算。

返回JSON格式:
{
  "optimistic": 3,
  "likely": 5,
  "pessimistic": 8,
  "expected": 5.17,
  "confidence": 0.85
}`

  const userPrompt = `任务描述: ${taskDescription}
复杂度: ${complexity || 3}/5
团队技能: ${teamSkills?.join(', ') || '未知'}

请估算工期，返回JSON格式。`

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt }
  ]

  try {
    const response = await callAI(messages, { provider: 'deepseek' })
    const result = parseAIJsonResponse(response.content, {
      optimistic: { type: 'number', required: true },
      likely: { type: 'number', required: true },
      pessimistic: { type: 'number', required: true },
      expected: { type: 'number', required: true }
    })

    return result
  } catch (error) {
    console.error('Duration estimation error:', error)
    throw error
  }
})
