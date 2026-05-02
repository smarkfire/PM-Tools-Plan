import { callAI } from '~/server/utils/ai/client'
import { isAIAvailable } from '~/server/utils/ai/fallback'
import type { Message } from '~/server/utils/ai/types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { project, tasks, milestoneName, milestoneEndDate } = body

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

  const completedTasks = tasks.filter((t: any) => t.status === '已完成')
  const inProgressTasks = tasks.filter((t: any) => t.status === '进行中')
  const delayedTasks = tasks.filter((t: any) =>
    t.status !== '已完成' && t.endDate && new Date(t.endDate) < new Date()
  )

  const milestone = milestoneName || project?.name || '项目'
  const milestoneDate = milestoneEndDate || project?.endDate || '未设置'

  const systemPrompt = `你是一个项目管理专家，负责生成里程碑总结报告。

里程碑总结格式要求（使用 Markdown）:
## 里程碑概述
- 里程碑名称和计划完成时间
- 实际完成情况

## 完成情况
- 已完成的任务清单
- 关键成果

## 延期分析
- 延期任务及原因
- 影响评估

## 经验教训
- 做得好的方面
- 需要改进的方面

## 下一步行动
- 后续重点任务
- 风险预防措施

请用专业但简洁的语气撰写。`

  const userPrompt = `项目名称: ${project?.name || '未命名项目'}
里程碑: ${milestone}
计划完成时间: ${milestoneDate}

已完成任务 (${completedTasks.length}个):
${completedTasks.length > 0 ? completedTasks.map((t: any) => `- ${t.name} (负责人: ${t.assignee || '未分配'}, 完成时间: ${t.endDate || '未知'})`).join('\n') : '- 暂无'}

进行中任务 (${inProgressTasks.length}个):
${inProgressTasks.length > 0 ? inProgressTasks.map((t: any) => `- ${t.name} (负责人: ${t.assignee || '未分配'})`).join('\n') : '- 暂无'}

延期任务 (${delayedTasks.length}个):
${delayedTasks.length > 0 ? delayedTasks.map((t: any) => `- ${t.name} (计划: ${t.endDate}, 负责人: ${t.assignee || '未分配'})`).join('\n') : '- 暂无'}

团队成员: ${project?.members?.map((m: any) => m.name).join('、') || '无'}

请生成里程碑总结报告。`

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]

  const response = await callAI(messages, { provider: 'deepseek', maxTokens: 3000 })

  return {
    title: `里程碑总结 - ${milestone}`,
    content: response.content,
    format: 'markdown',
    statistics: {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      inProgressTasks: inProgressTasks.length,
      delayedTasks: delayedTasks.length
    }
  }
})
