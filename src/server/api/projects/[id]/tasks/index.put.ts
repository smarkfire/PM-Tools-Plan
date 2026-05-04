import { eq, and } from 'drizzle-orm'
import { projects, tasks } from '~/server/db/schema'
import { db } from '~/server/db'
import { validateTaskName, sanitizeString, validateUuid } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')

  if (!projectId || !validateUuid(projectId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid project ID' })
  }

  const [project] = await db.select({ id: projects.id }).from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, userId)))
    .limit(1)

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  const body = await readBody(event)
  const { tasks: taskList, displaySettings, colorScheme, expandedTasks } = body

  if (!taskList || !Array.isArray(taskList)) {
    throw createError({ statusCode: 400, statusMessage: 'Tasks array is required' })
  }

  await db.delete(tasks).where(eq(tasks.projectId, projectId))

  const idMapping = new Map<string, string>()
  let totalInserted = 0

  const insertTask = async (task: any, parentId: string | null, sortOrder: number) => {
    const originalId = task.id
    const nameValidation = validateTaskName(task.name)
    if (!nameValidation.valid) return

    const validPriorities = ['low', 'medium', 'high', 'critical', '高', '中', '低']
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled', '待办', '进行中', '已完成']

    const resolvedParentId = parentId ? (idMapping.get(parentId) || parentId) : null

    const taskData = {
      projectId,
      parentId: resolvedParentId,
      wbsCode: task.wbs ? sanitizeString(String(task.wbs), 20) : null,
      name: sanitizeString(task.name, 200),
      startDate: task.startDate || null,
      endDate: task.endDate || null,
      duration: typeof task.duration === 'number' && task.duration > 0 ? task.duration : 1,
      deliverable: task.deliverable ? sanitizeString(String(task.deliverable), 1000) : null,
      assignee: task.assignee ? sanitizeString(String(task.assignee), 100) : null,
      priority: validPriorities.includes(task.priority) ? task.priority : 'medium',
      status: validStatuses.includes(task.status) ? task.status : 'pending',
      isMilestone: !!task.isMilestone,
      description: task.description ? sanitizeString(String(task.description), 5000) : null,
      sortOrder,
    }

    const [inserted] = await db.insert(tasks).values(taskData).returning({ id: tasks.id })
    idMapping.set(originalId, inserted.id)
    totalInserted++

    if (task.children && Array.isArray(task.children)) {
      for (let i = 0; i < task.children.length; i++) {
        await insertTask(task.children[i], originalId, i)
      }
    }
  }

  for (let i = 0; i < taskList.length; i++) {
    await insertTask(taskList[i], null, i)
  }

  return {
    success: true,
    taskCount: totalInserted,
    idMapping: Object.fromEntries(idMapping),
  }
})
