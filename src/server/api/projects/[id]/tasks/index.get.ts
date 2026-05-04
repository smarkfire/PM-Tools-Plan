import { eq, and } from 'drizzle-orm'
import { projects, tasks } from '~/server/db/schema'
import { db } from '~/server/db'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Project ID is required' })
  }

  const [project] = await db.select({ id: projects.id }).from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, userId)))
    .limit(1)

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  const rows = await db.select().from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(tasks.sortOrder)

  const taskList = rows.map(row => ({
    id: row.id,
    parentId: row.parentId,
    wbs: row.wbsCode || '',
    name: row.name,
    startDate: row.startDate,
    endDate: row.endDate,
    duration: row.duration || 1,
    deliverable: row.deliverable || '',
    assignee: row.assignee || '',
    priority: row.priority || 'medium',
    status: row.status || 'pending',
    isMilestone: row.isMilestone || false,
    description: row.description || '',
    children: [],
  }))

  const taskMap = new Map(taskList.map(t => [t.id, t]))
  const rootTasks: any[] = []

  for (const task of taskList) {
    if (task.parentId && taskMap.has(task.parentId)) {
      taskMap.get(task.parentId)!.children.push(task)
    } else {
      rootTasks.push(task)
    }
  }

  return {
    tasks: rootTasks,
    displaySettings: null,
    colorScheme: null,
    expandedTasks: [],
  }
})
