interface ProjectContext {
  name: string
  startDate: string
  endDate: string
  description: string
  members: Array<{ id: string; name: string; role: string }>
}

interface TaskSummary {
  id: string
  name: string
  status: string
  priority: string
  assignee: string
  startDate: string
  endDate: string
  duration: number
}

export function buildSystemPrompt(
  project: ProjectContext,
  tasks: TaskSummary[],
  extraPrompt?: string
): string {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === '已完成').length
  const inProgressTasks = tasks.filter(t => t.status === '进行中').length
  const todoTasks = tasks.filter(t => t.status === '待办').length
  const highPriorityTasks = tasks.filter(t => t.priority === '高')

  const now = new Date()
  const delayedTasks = tasks.filter(t => {
    if (!t.endDate || t.status === '已完成') return false
    return new Date(t.endDate) < now
  })

  const memberNames = project.members?.map(m => m.name).join('、') || '无'

  const taskListStr = tasks.slice(0, 30).map((t, i) =>
    `${i + 1}. ${t.name} | 状态:${t.status} | 优先级:${t.priority} | 负责人:${t.assignee || '未分配'} | 工期:${t.duration}天 | ${t.startDate || ''}~${t.endDate || ''}`
  ).join('\n')

  const moreTasksNote = tasks.length > 30 ? `\n...还有${tasks.length - 30}个任务未显示` : ''

  return `你是 PLAN-Tools 的 AI 项目管理助手。你可以帮助用户查询项目状态、分析风险、提供建议。

当前项目信息:
- 项目名称: ${project.name || '未命名项目'}
- 计划开始日期: ${project.startDate || '未设置'}
- 计划结束日期: ${project.endDate || '未设置'}
- 项目描述: ${project.description || '无'}
- 团队成员: ${memberNames}

任务统计:
- 总任务数: ${totalTasks}
- 已完成: ${completedTasks}
- 进行中: ${inProgressTasks}
- 待办: ${todoTasks}
- 高优先级: ${highPriorityTasks.length}个
- 已延期: ${delayedTasks.length}个

任务列表(前30个):
${taskListStr}${moreTasksNote}

回答要求:
1. 用简洁、友好的中文回答
2. 涉及具体任务时，引用任务名称
3. 给出建议时要有可操作性
4. 如果数据不足以判断，请说明
5. 使用 Markdown 格式让回答更易读（加粗、列表等）${extraPrompt ? `\n\n额外指令:\n${extraPrompt}` : ''}`
}
