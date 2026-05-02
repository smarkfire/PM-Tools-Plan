import { validatePositiveNumber } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { tasks, taskId, delayDays } = body

  if (!tasks || !Array.isArray(tasks)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid tasks format'
    })
  }

  if (!taskId || typeof taskId !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'taskId is required'
    })
  }

  const delayValidation = validatePositiveNumber(delayDays, '延期天数')
  if (!delayValidation.valid) {
    throw createError({
      statusCode: 400,
      statusMessage: delayValidation.message!
    })
  }

  const originalTask = tasks.find((t: any) => t.id === taskId)
  if (!originalTask) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Task not found'
    })
  }

  const affectedTasks = findAffectedTasks(tasks, taskId, delayDays)

  const totalDelay = affectedTasks.length > 0
    ? Math.max(...affectedTasks.map((t: any) => t.additionalDelay))
    : 0

  const projectEndDate = getLatestEndDate(tasks)
  const newProjectEndDate = projectEndDate
    ? addDays(new Date(projectEndDate), totalDelay)
    : null

  return {
    originalTask: {
      id: originalTask.id,
      name: originalTask.name,
      endDate: originalTask.endDate,
      status: originalTask.status
    },
    delayDays,
    affectedTasks,
    totalDelay,
    projectImpact: newProjectEndDate ? {
      originalEndDate: projectEndDate,
      newEndDate: newProjectEndDate,
      projectDelayed: totalDelay > 0
    } : null
  }
})

function findAffectedTasks(tasks: any[], taskId: string, delayDays: number): any[] {
  const affected: any[] = []
  const visited = new Set<string>()

  const findDependents = (currentTaskId: string, currentDelay: number) => {
    if (visited.has(currentTaskId)) return
    visited.add(currentTaskId)

    tasks.forEach(t => {
      if (t.dependencies && Array.isArray(t.dependencies) && t.dependencies.includes(currentTaskId)) {
        const existingAffected = affected.find((a: any) => a.id === t.id)
        if (!existingAffected) {
          affected.push({
            id: t.id,
            name: t.name,
            originalEndDate: t.endDate,
            newEndDate: t.endDate ? addDays(new Date(t.endDate), currentDelay) : null,
            additionalDelay: currentDelay,
            status: t.status,
            assignee: t.assignee || '未分配'
          })
          findDependents(t.id, currentDelay)
        } else if (currentDelay > existingAffected.additionalDelay) {
          existingAffected.additionalDelay = currentDelay
          existingAffected.newEndDate = t.endDate ? addDays(new Date(t.endDate), currentDelay) : null
          findDependents(t.id, currentDelay)
        }
      }
    })
  }

  findDependents(taskId, delayDays)
  return affected
}

function addDays(date: Date, days: number): string {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result.toISOString().split('T')[0]
}

function getLatestEndDate(tasks: any[]): string | null {
  let latest: Date | null = null
  tasks.forEach(t => {
    if (t.endDate) {
      const d = new Date(t.endDate)
      if (!latest || d > latest) {
        latest = d
      }
    }
  })
  return latest ? latest.toISOString().split('T')[0] : null
}
