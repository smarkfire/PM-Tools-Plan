export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { tasks } = body

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: '任务列表不能为空'
    })
  }

  const systemPrompt = `你是一个项目管理专家，擅长分析任务之间的依赖关系。

请根据任务列表，分析并推荐任务之间的依赖关系:
1. 识别逻辑上的前置任务（如：设计必须在开发之前）
2. 避免循环依赖
3. 标注关键路径任务

返回JSON格式:
{
  "dependencies": [
    {
      "taskId": "2",
      "dependsOn": ["1"],
      "reason": "UI设计需要基于需求分析的结果"
    }
  ]
}`

  const taskList = tasks.map((t: any, i: number) =>
    `${i + 1}. ${t.name} (${t.duration || 0}天)`
  ).join('\n')

  const userPrompt = `任务列表:\n${taskList}\n\n请推荐依赖关系。`

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt }
  ]

  try {
    const response = await callAI(messages, { provider: 'deepseek' })
    const result = parseAIJsonResponse(response.content, {
      dependencies: { type: 'array', required: true }
    })

    return result
  } catch (error) {
    console.error('Dependency suggestion error:', error)
    throw error
  }
})
