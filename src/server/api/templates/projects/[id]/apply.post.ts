import { eq, sql } from 'drizzle-orm'
import { projectTemplates, projects, tasks } from '~/server/db/schema'
import { db } from '~/server/db'
import { validateUuid, sanitizeString } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const id = getRouterParam(event, 'id')

  if (!id || !validateUuid(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid template ID' })
  }

  const [template] = await db.select().from(projectTemplates)
    .where(eq(projectTemplates.id, id))
    .limit(1)

  if (!template) {
    throw createError({ statusCode: 404, statusMessage: 'Template not found' })
  }

  if (!template.isOfficial && template.userId !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Access denied' })
  }

  const body = await readBody(event)
  const projectName = body?.name ? sanitizeString(body.name, 200) : sanitizeString(template.name, 200)

  const [project] = await db.insert(projects).values({
    ownerId: userId,
    name: projectName,
    description: template.description || null,
    startDate: body?.startDate || null,
    endDate: body?.endDate || null,
  }).returning()

  if (template.phases && Array.isArray(template.phases)) {
    const taskValues = []
    let sortOrder = 0
    for (const phase of template.phases) {
      for (const task of phase.tasks || []) {
        taskValues.push({
          projectId: project.id,
          name: sanitizeString(task.name, 200),
          duration: typeof task.duration === 'number' && task.duration > 0 ? task.duration : 1,
          deliverable: task.deliverable ? sanitizeString(task.deliverable, 1000) : null,
          sortOrder: sortOrder++,
        })
      }
    }
    if (taskValues.length > 0) {
      await db.insert(tasks).values(taskValues)
    }
  }

  await db.update(projectTemplates)
    .set({ usageCount: sql`${projectTemplates.usageCount} + 1` })
    .where(eq(projectTemplates.id, id))

  return project
})
