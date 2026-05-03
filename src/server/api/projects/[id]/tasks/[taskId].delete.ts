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

  await db.delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)))

  return { success: true }
})
