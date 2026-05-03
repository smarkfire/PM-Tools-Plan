import { eq, and } from 'drizzle-orm'
import { projects, shares } from '~/server/db/schema'
import { db } from '~/server/db'
import { nanoid } from 'nanoid'
import { hashPassword } from '~/server/utils/auth'

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

  const body = await readBody(event) || {}
  const shareToken = nanoid(10)
  const passwordHash = body.password ? await hashPassword(body.password) : null
  const expiresAt = body.expiresInHours
    ? new Date(Date.now() + body.expiresInHours * 60 * 60 * 1000)
    : null

  const [share] = await db.insert(shares).values({
    projectId,
    shareToken,
    createdBy: userId,
    passwordHash,
    expiresAt,
  }).returning()

  return {
    id: share.id,
    shareToken: share.shareToken,
    expiresAt: share.expiresAt,
    hasPassword: !!share.passwordHash,
    createdAt: share.createdAt,
  }
})
