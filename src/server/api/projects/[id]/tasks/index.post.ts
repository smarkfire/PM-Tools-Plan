import { eq, and } from 'drizzle-orm'
import { projects, tasks } from '~/server/db/schema'
import { db } from '~/server/db'
import { validateTaskName, sanitizeString, validateDate, validateUuid } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')

  if (!projectId || !validateUuid(projectId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid project ID' })
  }

  const [project] = await db.select({ id: projects.id }).from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, userId)))
    .limit(1)

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  const body = await readBody(event)

  const nameValidation = validateTaskName(body.name)
  if (!nameValidation.valid) {
    throw createError({ statusCode: 400, statusMessage: nameValidation.message })
  }

  if (body.startDate && !validateDate(body.startDate)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid start date format' })
  }

  if (body.endDate && !validateDate(body.endDate)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid end date format' })
  }

  const validPriorities = ['low', 'medium', 'high', 'critical']
  const priority = validPriorities.includes(body.priority) ? body.priority : 'medium'

  const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled']
  const status = validStatuses.includes(body.status) ? body.status : 'pending'

  const [task] = await db.insert(tasks).values({
    projectId,
    parentId: body.parentId && validateUuid(body.parentId) ? body.parentId : null,
    wbsCode: body.wbsCode ? sanitizeString(body.wbsCode, 20) : null,
    name: sanitizeString(body.name, 200),
    startDate: body.startDate || null,
    endDate: body.endDate || null,
    duration: typeof body.duration === 'number' && body.duration > 0 ? body.duration : 1,
    deliverable: body.deliverable ? sanitizeString(body.deliverable, 1000) : null,
    assignee: body.assignee ? sanitizeString(body.assignee, 100) : null,
    priority,
    status,
    isMilestone: !!body.isMilestone,
    description: body.description ? sanitizeString(body.description, 5000) : null,
    sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : 0,
  }).returning()

  return task
})
