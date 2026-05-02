import { callAI } from '~/server/utils/ai/client'
import { isAIAvailable } from '~/server/utils/ai/fallback'
import type { Message } from '~/server/utils/ai/types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { project, tasks, dateRange } = body

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

  const now = new Date()
  const weekStart = dateRange?.start
    ? new Date(dateRange.start)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1)
  const weekEnd = dateRange?.end
    ? new Date(dateRange.end)
    : new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)

  const completedTasks = tasks.filter((t: any) =>
    t.status === '已完成' &&
    t.endDate &&
    new Date(t.endDate) >= weekStart &&
    new Date(t.endDate) <= weekEnd
  )

  const inProgressTasks = tasks.filter((t: any) =>
    t.status === '进行中'
  )

  const delayedTasks = tasks.filter((t: any) =>
    t.status !== '已完成' && t.endDate && new Date(t.endDate) < now
  )

  const systemPrompt = `你是一个项目管理专家，负责生成项目周报。

周报格式要求（使用 Markdown）:
## 本周进展
- 列出本周完成的任务
- 总结本周主要成果

## 下周计划
- 列出下周计划开展的任务
- 标注重点任务

## 风险提示
- 列出存在延期风险的任务
- 提出应对措施

## 需协调事项
- 列出需要协调的资源或事项

请用专业但简洁的语气撰写。`

  const userPrompt = `项目名称: ${project?.name || '未命名项目'}
本周时间范围: ${weekStart.toLocaleDateString('zh-CN')} ~ ${weekEnd.toLocaleDateString('zh-CN')}

本周完成任务:
${completedTasks.length > 0 ? completedTasks.map((t: any) => `- ${t.name} (负责人: ${t.assignee || '未分配'})`).join('\n') : '- 暂无完成任务'}

进行中任务:
${inProgressTasks.length > 0 ? inProgressTasks.map((t: any) => `- ${t.name} (计划完成: ${t.endDate || '未设置'}, 负责人: ${t.assignee || '未分配'})`).join('\n') : '- 暂无进行中任务'}

延期任务:
${delayedTasks.length > 0 ? delayedTasks.map((t: any) => `- ${t.name} (计划完成: ${t.endDate}, 负责人: ${t.assignee || '未分配'})`).join('\n') : '- 暂无延期任务'}

团队成员: ${project?.members?.map((m: any) => m.name).join('、') || '无'}

请生成项目周报。`

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]

  const response = await callAI(messages, { provider: 'deepseek', maxTokens: 3000 })

  return {
    title: `${project?.name || '项目'} 周报 - ${weekStart.toLocaleDateString('zh-CN')} ~ ${weekEnd.toLocaleDateString('zh-CN')}`,
    content: response.content,
    format: 'markdown',
    statistics: {
      completedTasks: completedTasks.length,
      inProgressTasks: inProgressTasks.length,
      delayedTasks: delayedTasks.length,
      totalTasks: tasks.length
    }
  }
})
