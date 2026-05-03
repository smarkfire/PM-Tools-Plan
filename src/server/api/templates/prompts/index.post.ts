import { promptTemplates } from '~/server/db/schema'
import { db } from '~/server/db'
import { sanitizeString } from '~/server/utils/validation'

const VALID_CATEGORIES = ['general', 'industry', 'report', 'chat']

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const body = await readBody(event)

  const { name, description, systemPrompt, category } = body

  if (!name || typeof name !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Template name is required' })
  }

  if (!systemPrompt || typeof systemPrompt !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'System prompt is required' })
  }

  if (systemPrompt.length > 5000) {
    throw createError({ statusCode: 400, statusMessage: 'System prompt must be less than 5000 characters' })
  }

  const sanitizedCategory = VALID_CATEGORIES.includes(category) ? category : 'general'

  const [template] = await db.insert(promptTemplates).values({
    userId,
    name: sanitizeString(name, 100),
    description: description ? sanitizeString(description, 1000) : null,
    systemPrompt: sanitizeString(systemPrompt, 5000),
    category: sanitizedCategory,
  }).returning()

  return template
})
