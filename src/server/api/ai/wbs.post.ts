import { getCache, setCache } from '~/server/utils/cache'
import { sanitizeInput, validateProjectName } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { projectName, projectDescription, startDate, endDate, industry, requirements, teamMembers, template, locale } = body

  const nameValidation = validateProjectName(projectName || '未命名项目')
  if (!nameValidation.valid) {
    throw createError({
      statusCode: 400,
      statusMessage: nameValidation.message!
    })
  }

  const sanitizedDescription = sanitizeInput(projectDescription || '')
  if (!sanitizedDescription) {
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

  const cacheKey = `wbs:${projectName}:${projectDescription}:${startDate}:${endDate}:${industry}`
  const cached = getCache(cacheKey)
  if (cached) {
    return cached
  }

  const teamInfo = teamMembers && teamMembers.length > 0
    ? `团队成员: ${teamMembers.join('、')}`
    : ''

  const startDateInfo = startDate
    ? `项目开始日期: ${startDate}`
    : ''

  const endDateInfo = endDate
    ? `项目结束日期: ${endDate}`
    : ''

  const isEn = locale === 'en' || locale?.startsWith('en')

  const systemPrompt = isEn
    ? `You are a professional project manager skilled in creating project plans. Please generate a detailed Work Breakdown Structure (WBS) based on the user's project description.

Requirements:
1. Task decomposition should follow SMART principles (Specific, Measurable, Achievable, Relevant, Time-bound)
2. Each task must include the following complete fields:
   - name: Task name (string)
   - duration: Duration in days (integer)
   - startDate: Start date, format YYYY-MM-DD (calculated based on project start date and predecessor tasks)
   - endDate: End date, format YYYY-MM-DD (startDate + duration - 1, skip weekends)
   - deliverable: Deliverable (string)
   - description: Task description (string)
   - assignee: Person responsible (assigned from team members, leave empty if no team members)
   - priority: Priority, one of "high", "medium", "low"
   - status: Status, set to "pending" uniformly
   - dependencies: Predecessor task name array (string array, referencing other tasks' name)
3. Tasks should have reasonable dependency relationships and date continuity
4. Return JSON format with nested structure representing parent-child tasks
5. Parent task duration should cover the time range of its child tasks
6. Parent tasks do not need startDate/endDate/assignee/priority fields, these are only set on leaf tasks
7. IMPORTANT - Multi-level decomposition: You MUST decompose tasks into at least 3 levels and up to 4 levels of depth. The structure should be:
   - Level 1: Major project phases (e.g., Requirements Analysis, Design, Development, Testing, Deployment)
   - Level 2: Sub-phases or work packages within each phase (e.g., under Development: Frontend Development, Backend Development)
   - Level 3: Specific tasks or activities (e.g., under Frontend Development: Page Layout, Component Development, API Integration)
   - Level 4 (optional): Detailed sub-tasks for complex activities (e.g., under Page Layout: Homepage Design, Dashboard Design)
   For simple or short projects, 3 levels is sufficient. For complex or long-duration projects, use 4 levels to provide adequate detail.
   Do NOT stop at 2 levels - always go deeper to provide actionable task detail.

Return format example (showing 4-level structure):
{
  "tasks": [
    {
      "name": "Requirements Analysis",
      "duration": 15,
      "deliverable": "Requirements Documentation",
      "description": "Complete requirements analysis phase",
      "children": [
        {
          "name": "Requirements Elicitation",
          "duration": 8,
          "deliverable": "Requirements Research Report",
          "description": "Gather requirements from stakeholders",
          "children": [
            {
              "name": "Stakeholder Interviews",
              "duration": 4,
              "startDate": "2025-01-06",
              "endDate": "2025-01-09",
              "deliverable": "Interview Notes",
              "description": "Conduct interviews with key stakeholders",
              "assignee": "John",
              "priority": "high",
              "status": "pending",
              "dependencies": []
            },
            {
              "name": "Document Analysis",
              "duration": 3,
              "startDate": "2025-01-10",
              "endDate": "2025-01-14",
              "deliverable": "Document Analysis Report",
              "description": "Analyze existing documentation and systems",
              "assignee": "Alice",
              "priority": "medium",
              "status": "pending",
              "dependencies": ["Stakeholder Interviews"]
            }
          ]
        },
        {
          "name": "Requirements Specification",
          "duration": 7,
          "deliverable": "Requirements Specification Document",
          "description": "Document and validate requirements",
          "children": [
            {
              "name": "Write Requirements Doc",
              "duration": 4,
              "startDate": "2025-01-15",
              "endDate": "2025-01-20",
              "deliverable": "Requirements Spec Draft",
              "description": "Draft the requirements specification",
              "assignee": "John",
              "priority": "high",
              "status": "pending",
              "dependencies": ["Document Analysis"]
            },
            {
              "name": "Requirements Review",
              "duration": 3,
              "startDate": "2025-01-21",
              "endDate": "2025-01-23",
              "deliverable": "Review Meeting Minutes",
              "description": "Review and approve requirements with stakeholders",
              "assignee": "Alice",
              "priority": "high",
              "status": "pending",
              "dependencies": ["Write Requirements Doc"]
            }
          ]
        }
      ]
    }
  ]
}`
    : `你是一个专业的项目经理，擅长制定项目计划。请根据用户的项目描述生成详细的任务分解结构(WBS)。

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
7. 【重要】多层级分解：你必须将任务分解为至少3层、最多4层的深度结构。层级说明：
   - 第1层：项目主要阶段（如：需求分析、系统设计、开发实现、测试验证、上线部署）
   - 第2层：阶段下的工作包或子阶段（如：开发实现下分为前端开发、后端开发）
   - 第3层：具体任务或活动（如：前端开发下分为页面布局、组件开发、接口联调）
   - 第4层（可选）：复杂活动的详细子任务（如：页面布局下分为首页设计、仪表盘设计）
   对于简单或周期短的项目，3层即可；对于复杂或周期长的项目，使用4层以提供足够的细节。
   绝对不要只分解到2层就停止——必须深入到可执行的任务粒度。

返回格式示例（展示4层结构）:
{
  "tasks": [
    {
      "name": "需求分析",
      "duration": 15,
      "deliverable": "需求文档",
      "description": "完成项目需求分析阶段",
      "children": [
        {
          "name": "需求获取",
          "duration": 8,
          "deliverable": "需求调研报告",
          "description": "从干系人处收集需求",
          "children": [
            {
              "name": "干系人访谈",
              "duration": 4,
              "startDate": "2025-01-06",
              "endDate": "2025-01-09",
              "deliverable": "访谈记录",
              "description": "与关键干系人进行需求访谈",
              "assignee": "张三",
              "priority": "高",
              "status": "待办",
              "dependencies": []
            },
            {
              "name": "文档分析",
              "duration": 3,
              "startDate": "2025-01-10",
              "endDate": "2025-01-14",
              "deliverable": "文档分析报告",
              "description": "分析现有文档和系统",
              "assignee": "李四",
              "priority": "中",
              "status": "待办",
              "dependencies": ["干系人访谈"]
            }
          ]
        },
        {
          "name": "需求规格编写",
          "duration": 7,
          "deliverable": "需求规格说明书",
          "description": "编写并确认需求规格",
          "children": [
            {
              "name": "编写需求文档",
              "duration": 4,
              "startDate": "2025-01-15",
              "endDate": "2025-01-20",
              "deliverable": "需求规格初稿",
              "description": "起草需求规格说明书",
              "assignee": "张三",
              "priority": "高",
              "status": "待办",
              "dependencies": ["文档分析"]
            },
            {
              "name": "需求评审",
              "duration": 3,
              "startDate": "2025-01-21",
              "endDate": "2025-01-23",
              "deliverable": "评审会议纪要",
              "description": "与干系人评审并确认需求",
              "assignee": "李四",
              "priority": "高",
              "status": "待办",
              "dependencies": ["编写需求文档"]
            }
          ]
        }
      ]
    }
  ]
}`

  const userPrompt = isEn
    ? `Project Name: ${projectName || 'Untitled Project'}
${startDateInfo}
${endDateInfo}
${teamInfo}
Project Description: ${projectDescription}
Industry: ${industry || 'Not specified'}
Special Requirements: ${requirements || 'None'}
${template ? `Reference Template: ${template.name}` : ''}

Please generate a complete Work Breakdown Structure with 3-4 levels of depth, ensuring each leaf task has a start date, end date, assignee, and priority. All task dates must be within the project start and end date range. Do NOT stop at 2 levels — decompose into at least 3 levels (phases → work packages → tasks), and use 4 levels for complex or long-duration projects. Return JSON format.`
    : `项目名称: ${projectName || '未命名项目'}
${startDateInfo}
${endDateInfo}
${teamInfo}
项目描述: ${projectDescription}
行业类型: ${industry || '未指定'}
特殊要求: ${requirements || '无'}
${template ? `参考模板: ${template.name}` : ''}

请生成3-4层深度的完整任务分解结构，确保每个叶子任务都有开始日期、结束日期、负责人和优先级。所有任务日期必须在项目开始日期和结束日期范围内。绝对不要只分解到2层——至少分解到3层（阶段→工作包→任务），复杂或周期长的项目使用4层。返回JSON格式。`

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt }
  ]

  try {
    const response = await callAI(messages, { provider: 'deepseek', maxTokens: 8192 })
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

    const result = {
      tasks: tasks.tasks,
      statistics: {
        totalTasks,
        estimatedDuration,
        criticalPathCount
      },
      usage: {
        model: response.model,
        provider: response.provider,
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens
      }
    }

    setCache(cacheKey, result, 86400000)

    return result
  } catch (error) {
    console.error('WBS generation error:', error)
    throw error
  }
})
