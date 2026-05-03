import { eq, and } from 'drizzle-orm'
import { projects, members } from '~/server/db/schema'
import { db } from '~/server/db'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')
  const memberId = getRouterParam(event, 'memberId')

  if (!projectId || !memberId) {
    throw createError({ statusCode: 400, statusMessage: 'Project ID and Member ID are required' })
  }

  const [project] = await db.select({ id: projects.id }).from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, userId)))
    .limit(1)

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  await db.delete(members)
    .where(and(eq(members.id, memberId), eq(members.projectId, projectId)))

  return { success: true }
})
