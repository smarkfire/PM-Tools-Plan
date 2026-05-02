import { callAI } from '~/server/utils/ai/client'
import { isAIAvailable } from '~/server/utils/ai/fallback'
import type { Message } from '~/server/utils/ai/types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { project, tasks, year, month } = body

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
  const reportYear = year || now.getFullYear()
  const reportMonth = month || now.getMonth() + 1

  const monthlyTasks = tasks.filter((task: any) => {
    if (!task.endDate) return false
    const d = new Date(task.endDate)
    return d.getFullYear() === reportYear && d.getMonth() === reportMonth - 1
  })

  const completedTasks = monthlyTasks.filter((t: any) => t.status === '已完成')
  const inProgressTasks = monthlyTasks.filter((t: any) => t.status === '进行中')
  const delayedTasks = monthlyTasks.filter((t: any) => t.status !== '已完成' && t.endDate && new Date(t.endDate) < now)

  const totalTasks = tasks.length
  const allCompleted = tasks.filter((t: any) => t.status === '已完成').length
  const progressPercent = totalTasks > 0 ? Math.round(allCompleted / totalTasks * 100) : 0

  const systemPrompt = `你是一个项目管理专家，负责生成项目月报。

月报格式要求（使用 Markdown）:
## 项目概况
- 项目整体进度
- 本月关键里程碑

## 本月进展
- 按阶段列出完成的任务
- 总结主要成果

## 问题与风险
- 延期任务分析
- 资源瓶颈
- 依赖风险

## 下月计划
- 重点任务
- 里程碑节点

## 改进建议
- 流程优化建议
- 资源调配建议

请用专业但简洁的语气撰写。`

  const userPrompt = `项目名称: ${project?.name || '未命名项目'}
报告月份: ${reportYear}年${reportMonth}月

项目整体进度: ${progressPercent}%
总任务数: ${totalTasks}, 已完成: ${allCompleted}

本月完成任务 (${completedTasks.length}个):
${completedTasks.length > 0 ? completedTasks.map((t: any) => `- ${t.name} (负责人: ${t.assignee || '未分配'})`).join('\n') : '- 暂无'}

本月进行中任务 (${inProgressTasks.length}个):
${inProgressTasks.length > 0 ? inProgressTasks.map((t: any) => `- ${t.name} (负责人: ${t.assignee || '未分配'})`).join('\n') : '- 暂无'}

延期任务 (${delayedTasks.length}个):
${delayedTasks.length > 0 ? delayedTasks.map((t: any) => `- ${t.name} (计划: ${t.endDate}, 负责人: ${t.assignee || '未分配'})`).join('\n') : '- 暂无'}

团队成员: ${project?.members?.map((m: any) => m.name).join('、') || '无'}

请生成项目月报。`

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]

  const response = await callAI(messages, { provider: 'deepseek', maxTokens: 4000 })

  return {
    title: `${project?.name || '项目'} 月报 - ${reportYear}年${reportMonth}月`,
    content: response.content,
    format: 'markdown',
    statistics: {
      totalTasks,
      completedTasks: allCompleted,
      monthlyCompleted: completedTasks.length,
      monthlyInProgress: inProgressTasks.length,
      monthlyDelayed: delayedTasks.length,
      progress: progressPercent
    }
  }
})
