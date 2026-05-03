import { eq, and } from 'drizzle-orm'
import { projectTemplates } from '~/server/db/schema'
import { db } from '~/server/db'
import { sanitizeString, validateUuid } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const id = getRouterParam(event, 'id')

  if (!id || !validateUuid(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid template ID' })
  }

  const [existing] = await db.select().from(projectTemplates)
    .where(eq(projectTemplates.id, id))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Template not found' })
  }

  if (existing.isOfficial) {
    throw createError({ statusCode: 403, statusMessage: 'Cannot edit official templates' })
  }

  if (existing.userId !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Access denied' })
  }

  const body = await readBody(event)
  const updates: Record<string, any> = { updatedAt: new Date() }

  if (body.name) updates.name = sanitizeString(body.name, 200)
  if (body.icon !== undefined) updates.icon = sanitizeString(body.icon, 10)
  if (body.description !== undefined) updates.description = body.description ? sanitizeString(body.description, 1000) : null
  if (body.industry !== undefined) updates.industry = body.industry ? sanitizeString(body.industry, 50) : null
  if (body.phases) {
    if (!Array.isArray(body.phases) || body.phases.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'At least one phase is required' })
    }
    updates.phases = body.phases
  }
  if (body.linkedPromptId !== undefined) updates.linkedPromptId = body.linkedPromptId || null

  const [updated] = await db.update(projectTemplates)
    .set(updates)
    .where(and(eq(projectTemplates.id, id), eq(projectTemplates.userId, userId)))
    .returning()

  return updated
})
