import { eq, and } from 'drizzle-orm'
import { projects, shares } from '~/server/db/schema'
import { db } from '~/server/db'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')
  const shareId = getRouterParam(event, 'shareId')

  if (!projectId || !shareId) {
    throw createError({ statusCode: 400, statusMessage: 'Project ID and Share ID are required' })
  }

  const [project] = await db.select({ id: projects.id }).from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, userId)))
    .limit(1)

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  await db.update(shares)
    .set({ isActive: false })
    .where(and(eq(shares.id, shareId), eq(shares.projectId, projectId)))

  return { success: true }
})
