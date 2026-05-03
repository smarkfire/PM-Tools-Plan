import { eq, and } from 'drizzle-orm'
import { promptTemplates } from '~/server/db/schema'
import { db } from '~/server/db'
import { sanitizeString, validateUuid } from '~/server/utils/validation'

const VALID_CATEGORIES = ['general', 'industry', 'report', 'chat']

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const id = getRouterParam(event, 'id')

  if (!id || !validateUuid(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid template ID' })
  }

  const [existing] = await db.select().from(promptTemplates)
    .where(eq(promptTemplates.id, id))
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

  if (body.name) updates.name = sanitizeString(body.name, 100)
  if (body.description !== undefined) updates.description = body.description ? sanitizeString(body.description, 1000) : null
  if (body.systemPrompt) {
    if (body.systemPrompt.length > 5000) {
      throw createError({ statusCode: 400, statusMessage: 'System prompt must be less than 5000 characters' })
    }
    updates.systemPrompt = sanitizeString(body.systemPrompt, 5000)
  }
  if (body.category && VALID_CATEGORIES.includes(body.category)) {
    updates.category = body.category
  }

  const [updated] = await db.update(promptTemplates)
    .set(updates)
    .where(and(eq(promptTemplates.id, id), eq(promptTemplates.userId, userId)))
    .returning()

  return updated
})
