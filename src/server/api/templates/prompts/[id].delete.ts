import { eq, and } from 'drizzle-orm'
import { promptTemplates } from '~/server/db/schema'
import { db } from '~/server/db'
import { validateUuid } from '~/server/utils/validation'

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
    throw createError({ statusCode: 403, statusMessage: 'Cannot delete official templates' })
  }

  if (existing.userId !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Access denied' })
  }

  await db.delete(promptTemplates)
    .where(and(eq(promptTemplates.id, id), eq(promptTemplates.userId, userId)))

  return { success: true }
})
