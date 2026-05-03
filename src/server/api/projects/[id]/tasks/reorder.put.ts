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

  const body = await readBody(event)
  const { taskOrders } = body as { taskOrders: { id: string; sortOrder: number }[] }

  if (!Array.isArray(taskOrders)) {
    throw createError({ statusCode: 400, statusMessage: 'taskOrders must be an array' })
  }

  for (const item of taskOrders) {
    await db.update(tasks)
      .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
      .where(and(eq(tasks.id, item.id), eq(tasks.projectId, projectId)))
  }

  return { success: true }
})
