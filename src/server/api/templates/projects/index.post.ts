import { projectTemplates } from '~/server/db/schema'
import { db } from '~/server/db'
import { sanitizeString } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const body = await readBody(event)

  const { name, icon, description, industry, phases, linkedPromptId } = body

  if (!name || typeof name !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Template name is required' })
  }

  if (!phases || !Array.isArray(phases) || phases.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'At least one phase is required' })
  }

  for (const phase of phases) {
    if (!phase.name || !Array.isArray(phase.tasks) || phase.tasks.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'Each phase must have a name and at least one task' })
    }
  }

  const [template] = await db.insert(projectTemplates).values({
    userId,
    name: sanitizeString(name, 200),
    icon: icon ? sanitizeString(icon, 10) : '📋',
    description: description ? sanitizeString(description, 1000) : null,
    industry: industry ? sanitizeString(industry, 50) : null,
    phases,
    linkedPromptId: linkedPromptId || null,
  }).returning()

  return template
})
