import { eq } from 'drizzle-orm'
import { promptTemplates } from '~/server/db/schema'
import { db } from '~/server/db'
import { validateUuid } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const id = getRouterParam(event, 'id')

  if (!id || !validateUuid(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid template ID' })
  }

  const [template] = await db.select().from(promptTemplates)
    .where(eq(promptTemplates.id, id))
    .limit(1)

  if (!template) {
    throw createError({ statusCode: 404, statusMessage: 'Template not found' })
  }

  if (!template.isOfficial && template.userId !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Access denied' })
  }

  return template
})
