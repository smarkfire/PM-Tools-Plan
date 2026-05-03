import { eq, and } from 'drizzle-orm'
import { projects, tasks } from '~/server/db/schema'
import { db } from '~/server/db'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')
  const taskId = getRouterParam(event, 'taskId')

  if (!projectId || !taskId) {
    throw createError({ statusCode: 400, statusMessage: 'Project ID and Task ID are required' })
  }

  const [project] = await db.select({ id: projects.id }).from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, userId)))
    .limit(1)

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  const body = await readBody(event)

  const [updated] = await db.update(tasks)
    .set({
      ...(body.parentId !== undefined && { parentId: body.parentId }),
      ...(body.wbsCode !== undefined && { wbsCode: body.wbsCode }),
      ...(body.name !== undefined && { name: body.name }),
      ...(body.startDate !== undefined && { startDate: body.startDate }),
      ...(body.endDate !== undefined && { endDate: body.endDate }),
      ...(body.duration !== undefined && { duration: body.duration }),
      ...(body.deliverable !== undefined && { deliverable: body.deliverable }),
      ...(body.assignee !== undefined && { assignee: body.assignee }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.isMilestone !== undefined && { isMilestone: body.isMilestone }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }

  return updated
})
