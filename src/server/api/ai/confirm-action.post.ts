import type { ParsedAction } from '~/server/utils/ai/action-parser'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { action, projectData, tasks } = body

  if (!action || !action.type) {
    throw createError({
      statusCode: 400,
      statusMessage: 'action is required'
    })
  }

  if (!tasks || !Array.isArray(tasks)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid tasks format'
    })
  }

  try {
    let result

    switch (action.type) {
      case 'assign_task':
        result = executeAssignTask(action, projectData, tasks)
        break
      case 'update_duration':
        result = executeUpdateDuration(action, tasks)
        break
      case 'update_status':
        result = executeUpdateStatus(action, tasks)
        break
      case 'add_note':
        result = executeAddNote(action, tasks)
        break
      case 'set_priority':
        result = executeSetPriority(action, tasks)
        break
      default:
        throw new Error(`不支持的操作类型: ${action.type}`)
    }

    return {
      success: true,
      result,
      message: `操作成功: ${action.description}`
    }
  } catch (error: any) {
    return {
      success: false,
      message: `操作失败: ${error.message}`
    }
  }
})

function executeAssignTask(action: ParsedAction, projectData: any, tasks: any[]) {
  const { taskId, assigneeName } = action.params

  const member = projectData?.members?.find((m: any) => m.name === assigneeName)
  if (!member) {
    throw new Error(`未找到成员: ${assigneeName}`)
  }

  const taskIndex = tasks.findIndex(t => t.id === taskId)
  if (taskIndex === -1) {
    throw new Error('任务不存在')
  }

  tasks[taskIndex].assignee = member.name

  return {
    taskId,
    assignee: member.name,
    field: 'assignee'
  }
}

function executeUpdateDuration(action: ParsedAction, tasks: any[]) {
  const { taskId, duration } = action.params

  const task = tasks.find(t => t.id === taskId)
  if (!task) {
    throw new Error('任务不存在')
  }

  const newEndDate = calculateEndDate(task.startDate, duration)

  task.duration = duration
  task.endDate = newEndDate

  return {
    taskId,
    duration,
    newEndDate,
    field: 'duration'
  }
}

function executeUpdateStatus(action: ParsedAction, tasks: any[]) {
  const { taskId, status } = action.params

  const task = tasks.find(t => t.id === taskId)
  if (!task) {
    throw new Error('任务不存在')
  }

  task.status = status

  return { taskId, status, field: 'status' }
}

function executeAddNote(action: ParsedAction, tasks: any[]) {
  const { taskId, note } = action.params

  const task = tasks.find(t => t.id === taskId)
  if (!task) {
    throw new Error('任务不存在')
  }

  const existingDescription = task.description || ''
  task.description = existingDescription +
    (existingDescription ? '\n\n' : '') +
    `[备注] ${note}`

  return { taskId, note, field: 'description' }
}

function executeSetPriority(action: ParsedAction, tasks: any[]) {
  const { taskId, priority } = action.params

  const task = tasks.find(t => t.id === taskId)
  if (!task) {
    throw new Error('任务不存在')
  }

  task.priority = priority

  return { taskId, priority, field: 'priority' }
}

function calculateEndDate(startDate: string, duration: number): string {
  if (!startDate) return ''
  const start = new Date(startDate)
  start.setDate(start.getDate() + duration)
  return start.toISOString().split('T')[0]
}
