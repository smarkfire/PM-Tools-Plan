import { eq, and } from 'drizzle-orm'
import { projects, shares } from '~/server/db/schema'
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

  const result = await db.select({
    id: shares.id,
    shareToken: shares.shareToken,
    hasPassword: shares.passwordHash,
    expiresAt: shares.expiresAt,
    isActive: shares.isActive,
    viewCount: shares.viewCount,
    createdAt: shares.createdAt,
  }).from(shares)
    .where(eq(shares.projectId, projectId))

  return result.map(s => ({
    ...s,
    hasPassword: !!s.hasPassword,
  }))
})
