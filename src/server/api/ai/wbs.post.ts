export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { projectDescription, industry, requirements, template } = body

  if (!projectDescription) {
    throw createError({
      statusCode: 400,
      statusMessage: '项目描述不能为空'
    })
  }

  if (!isAIAvailable()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'AI 服务未配置，请先在 .env 文件中配置 API Key'
    })
  }

  const systemPrompt = `你是一个专业的项目经理，擅长制定项目计划。请根据用户的项目描述生成详细的任务分解结构(WBS)。

要求:
1. 任务分解要符合SMART原则（具体、可衡量、可达成、相关性、时限性）
2. 每个任务包含：任务名称、工期（天）、交付物、描述
3. 任务之间要有合理的依赖关系
4. 返回JSON格式，嵌套结构表示父子任务

返回格式示例:
{
  "tasks": [
    {
      "name": "需求分析",
      "duration": 5,
      "deliverable": "需求规格说明书",
      "description": "收集和分析项目需求",
      "children": [
        {
          "name": "需求调研",
          "duration": 3,
          "deliverable": "需求调研报告",
          "description": "与 stakeholders 进行需求调研"
        }
      ]
    }
  ]
}`

  const userPrompt = `项目描述: ${projectDescription}
行业类型: ${industry || '未指定'}
特殊要求: ${requirements || '无'}
${template ? `参考模板: ${template.name}` : ''}

请生成任务分解结构，返回JSON格式。`

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt }
  ]

  try {
    const response = await callAI(messages, { provider: 'deepseek' })
    const content = response.content

    let tasks
    try {
      tasks = parseAIJsonResponse(content, {
        tasks: { type: 'array', required: true }
      })
    } catch (parseError: any) {
      throw createError({
        statusCode: 500,
        statusMessage: `AI返回格式错误: ${parseError.message}，请重试`
      })
    }

    if (!tasks.tasks || !Array.isArray(tasks.tasks) || tasks.tasks.length === 0) {
      throw createError({
        statusCode: 500,
        statusMessage: 'AI返回的任务列表为空，请提供更详细的项目描述'
      })
    }

    const totalTasks = countTasks(tasks.tasks)
    const estimatedDuration = calculateTotalDuration(tasks.tasks)
    const criticalPathCount = findCriticalPathCount(tasks.tasks)

    return {
      tasks: tasks.tasks,
      statistics: {
        totalTasks,
        estimatedDuration,
        criticalPathCount
      }
    }
  } catch (error) {
    console.error('WBS generation error:', error)
    throw error
  }
})
