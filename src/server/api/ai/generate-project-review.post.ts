import { callAI } from '~/server/utils/ai/client'
import { isAIAvailable } from '~/server/utils/ai/fallback'
import type { Message } from '~/server/utils/ai/types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { project, tasks, locale } = body

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
  const todoTasks = tasks.filter((t: any) => t.status === '待办')
  const delayedTasks = tasks.filter((t: any) =>
    t.status !== '已完成' && t.endDate && new Date(t.endDate) < new Date()
  )
  const highPriorityTasks = tasks.filter((t: any) => t.priority === '高')

  const progressPercent = tasks.length > 0 ? Math.round(completedTasks.length / tasks.length * 100) : 0

  const assigneeStats = new Map<string, { completed: number; total: number }>()
  tasks.forEach((t: any) => {
    if (t.assignee) {
      const stat = assigneeStats.get(t.assignee) || { completed: 0, total: 0 }
      stat.total++
      if (t.status === '已完成') stat.completed++
      assigneeStats.set(t.assignee, stat)
    }
  })

  const memberPerformance = Array.from(assigneeStats.entries()).map(([name, stat]) =>
    `- ${name}: 完成 ${stat.completed}/${stat.total} 个任务`
  ).join('\n')

  const isEn = locale === 'en' || locale?.startsWith('en')

  const systemPrompt = isEn
    ? `You are a project management expert responsible for generating project review reports.

Review report format requirements (using Markdown):
## Overall Project Assessment
- Project goal achievement
- Schedule variance analysis

## Success Summary
- What went well
- Replicable experiences

## Issues and Challenges
- Major problems encountered
- Delay cause analysis
- Resource bottlenecks

## Improvement Recommendations
- Process improvements
- Tool improvements
- Communication improvements

## Team Performance
- Member contributions
- Collaboration evaluation

## Follow-up Action Items
- Items requiring follow-up
- Improvement plans

Please write in a professional, objective tone, focusing on data support and actionability.`
    : `你是一个项目管理专家，负责生成项目复盘报告。

复盘报告格式要求（使用 Markdown）:
## 项目整体评估
- 项目目标达成情况
- 进度偏差分析

## 成功经验总结
- 做得好的方面
- 可复制的经验

## 问题与挑战
- 遇到的主要问题
- 延期原因分析
- 资源瓶颈

## 改进建议
- 流程改进
- 工具改进
- 沟通改进

## 团队表现
- 成员贡献
- 协作评价

## 后续行动项
- 需要跟进的事项
- 改进计划

请用专业、客观的语气撰写，注重数据支撑和可操作性。`

  const userPrompt = isEn
    ? `Project Name: ${project?.name || 'Untitled Project'}
Project Period: ${project?.startDate || 'Not set'} ~ ${project?.endDate || 'Not set'}
Project Description: ${project?.description || 'None'}

Overall Progress: ${progressPercent}%
Total Tasks: ${tasks.length}
Completed: ${completedTasks.length}, In Progress: ${inProgressTasks.length}, To Do: ${todoTasks.length}
High Priority Tasks: ${highPriorityTasks.length}
Overdue Tasks: ${delayedTasks.length}

Overdue Task Details:
${delayedTasks.length > 0 ? delayedTasks.map((t: any) => `- ${t.name} (Planned: ${t.endDate}, Assignee: ${t.assignee || 'Unassigned'})`).join('\n') : '- No overdue tasks'}

Team Member Performance:
${memberPerformance || '- No data available'}

Team Members: ${project?.members?.map((m: any) => m.name).join(', ') || 'None'}

Please generate a project review report.`
    : `项目名称: ${project?.name || '未命名项目'}
项目周期: ${project?.startDate || '未设置'} ~ ${project?.endDate || '未设置'}
项目描述: ${project?.description || '无'}

整体进度: ${progressPercent}%
总任务数: ${tasks.length}
已完成: ${completedTasks.length}, 进行中: ${inProgressTasks.length}, 待办: ${todoTasks.length}
高优先级任务: ${highPriorityTasks.length}个
延期任务: ${delayedTasks.length}个

延期任务详情:
${delayedTasks.length > 0 ? delayedTasks.map((t: any) => `- ${t.name} (计划: ${t.endDate}, 负责人: ${t.assignee || '未分配'})`).join('\n') : '- 暂无延期'}

团队成员表现:
${memberPerformance || '- 暂无数据'}

团队成员: ${project?.members?.map((m: any) => m.name).join('、') || '无'}

请生成项目复盘报告。`

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]

  const response = await callAI(messages, { provider: 'deepseek', maxTokens: 5000 })

  return {
    title: `${project?.name || '项目'} 项目复盘报告`,
    content: response.content,
    format: 'markdown',
    sections: [
      '项目整体评估',
      '成功经验总结',
      '问题与挑战',
      '改进建议',
      '团队表现',
      '后续行动项'
    ],
    statistics: {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      progress: progressPercent,
      delayedTasks: delayedTasks.length,
      highPriorityTasks: highPriorityTasks.length
    }
  }
})
