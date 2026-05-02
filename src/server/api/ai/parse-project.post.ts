import { callAI } from '~/server/utils/ai/client'
import { isAIAvailable } from '~/server/utils/ai/fallback'
import { sanitizeInput } from '~/server/utils/validation'
import { parseAIJsonResponse } from '~/server/utils/ai/parser'
import type { Message } from '~/server/utils/ai/types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { input } = body

  const sanitized = sanitizeInput(input || '')
  if (!sanitized || sanitized.length < 5) {
    throw createError({
      statusCode: 400,
      statusMessage: '请输入更多项目信息（至少5个字符）'
    })
  }

  if (!isAIAvailable()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'AI 服务未配置'
    })
  }

  const systemPrompt = `你是一个项目信息提取助手。用户会输入一段关于项目的自由描述，请从中提取结构化的项目信息。

需要提取的字段:
1. projectName - 项目名称（字符串，简洁明了）
2. startDate - 项目开始日期（格式 YYYY-MM-DD，如果用户说了"3个月"、"半年"等时间范围，请推算合理的开始日期，默认从今天开始）
3. endDate - 项目结束日期（格式 YYYY-MM-DD，根据用户描述的时间范围推算）
4. description - 项目描述（字符串，整理用户描述的项目目标和范围，补充合理细节）
5. industry - 行业类型（取值: software/marketing/construction/other）
6. teamMembers - 团队成员数组，每项包含 name（姓名）和 role（角色，如前端/后端/测试/设计/项目经理等）
7. requirements - 特殊要求（字符串，提取用户提到的技术要求、规范要求等）

注意:
- 如果用户没有明确提到某个字段，请根据上下文合理推断或留空
- 日期推算要合理，工作日计算需跳过周末
- 团队成员的角色要尽量具体
- 项目描述要专业、完整

返回JSON格式:
{
  "projectName": "电商网站开发",
  "startDate": "2026-05-04",
  "endDate": "2026-08-04",
  "description": "开发一个功能完整的电商网站，包含商品管理、购物车、订单处理、支付集成等核心功能",
  "industry": "software",
  "teamMembers": [
    { "name": "张三", "role": "前端开发" },
    { "name": "李四", "role": "后端开发" }
  ],
  "requirements": "需要支持移动端适配"
}`

  const userPrompt = `请从以下描述中提取项目信息：

${sanitized}`

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]

  try {
    const response = await callAI(messages, { provider: 'deepseek', maxTokens: 1500 })

    const result = parseAIJsonResponse<{
      projectName?: string
      startDate?: string
      endDate?: string
      description?: string
      industry?: string
      teamMembers?: Array<{ name: string; role: string }>
      requirements?: string
    }>(response.content)

    return {
      projectName: result.projectName || '',
      startDate: result.startDate || '',
      endDate: result.endDate || '',
      description: result.description || '',
      industry: result.industry || '',
      teamMembers: (result.teamMembers || []).map(m => ({
        name: m.name || '',
        role: m.role || '',
        email: ''
      })),
      requirements: result.requirements || ''
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `AI 解析失败: ${error.message || '未知错误'}`
    })
  }
})
