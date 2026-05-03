import { eq, and } from 'drizzle-orm'
import { projects, members } from '~/server/db/schema'
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

  const [member] = await db.insert(members).values({
    projectId,
    userId: body.userId || null,
    name: body.name,
    email: body.email || null,
    role: body.role || null,
    phone: body.phone || null,
  }).returning()

  return member
})
