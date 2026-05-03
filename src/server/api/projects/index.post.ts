import { projects } from '~/server/db/schema'
import { db } from '~/server/db'
import { validateProjectName, sanitizeString, validateDate } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const body = await readBody(event)

  const { name, description, startDate, endDate } = body

  const nameValidation = validateProjectName(name)
  if (!nameValidation.valid) {
    throw createError({
      statusCode: 400,
      statusMessage: nameValidation.message,
    })
  }

  if (startDate && !validateDate(startDate)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid start date format',
    })
  }

  if (endDate && !validateDate(endDate)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid end date format',
    })
  }

  const [project] = await db.insert(projects).values({
    ownerId: userId,
    name: sanitizeString(name, 200),
    description: description ? sanitizeString(description, 5000) : null,
    startDate: startDate || null,
    endDate: endDate || null,
  }).returning()

  return project
})
