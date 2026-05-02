export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { projectName, projectDescription, startDate, industry, requirements, teamMembers, template } = body

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

  const teamInfo = teamMembers && teamMembers.length > 0
    ? `团队成员: ${teamMembers.join('、')}`
    : ''

  const startDateInfo = startDate
    ? `项目开始日期: ${startDate}`
    : ''

  const systemPrompt = `你是一个专业的项目经理，擅长制定项目计划。请根据用户的项目描述生成详细的任务分解结构(WBS)。

要求:
1. 任务分解要符合SMART原则（具体、可衡量、可达成、相关性、时限性）
2. 每个任务必须包含以下完整字段:
   - name: 任务名称（字符串）
   - duration: 工期天数（整数）
   - startDate: 开始日期，格式 YYYY-MM-DD（根据项目开始日期和前置任务推算）
   - endDate: 结束日期，格式 YYYY-MM-DD（startDate + duration - 1，跳过周末）
   - deliverable: 交付物（字符串）
   - description: 任务描述（字符串）
   - assignee: 负责人（从团队成员中分配，如果没有团队成员则留空）
   - priority: 优先级，取值为"高"、"中"、"低"之一
   - status: 状态，统一设为"待办"
   - dependencies: 前置依赖任务名称数组（字符串数组，引用其他任务的name）
3. 任务之间要有合理的依赖关系和日期衔接
4. 返回JSON格式，嵌套结构表示父子任务
5. 父任务的工期应覆盖其子任务的时间范围
6. 父任务不需要startDate/endDate/assignee/priority字段，这些只在叶子任务上设置

返回格式示例:
{
  "tasks": [
    {
      "name": "需求分析",
      "duration": 8,
      "deliverable": "需求规格说明书",
      "description": "收集和分析项目需求",
      "children": [
        {
          "name": "需求调研",
          "duration": 3,
          "startDate": "2025-01-06",
          "endDate": "2025-01-08",
          "deliverable": "需求调研报告",
          "description": "与 stakeholders 进行需求调研",
          "assignee": "张三",
          "priority": "高",
          "status": "待办",
          "dependencies": []
        },
        {
          "name": "需求分析",
          "duration": 5,
          "startDate": "2025-01-09",
          "endDate": "2025-01-15",
          "deliverable": "需求规格说明书",
          "description": "整理和分析需求",
          "assignee": "张三",
          "priority": "高",
          "status": "待办",
          "dependencies": ["需求调研"]
        }
      ]
    }
  ]
}`

  const userPrompt = `项目名称: ${projectName || '未命名项目'}
${startDateInfo}
${teamInfo}
项目描述: ${projectDescription}
行业类型: ${industry || '未指定'}
特殊要求: ${requirements || '无'}
${template ? `参考模板: ${template.name}` : ''}

请生成完整的任务分解结构，确保每个叶子任务都有开始日期、结束日期、负责人和优先级。返回JSON格式。`

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
