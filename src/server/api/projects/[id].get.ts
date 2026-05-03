import { eq, and } from 'drizzle-orm'
import { projects, tasks, members } from '~/server/db/schema'
import { db } from '~/server/db'
import { validateUuid } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')

  if (!projectId || !validateUuid(projectId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid project ID' })
  }

  const [project] = await db.select().from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, userId)))
    .limit(1)

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  const [projectTasks, projectMembers] = await Promise.all([
    db.select().from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(tasks.sortOrder),
    db.select().from(members)
      .where(eq(members.projectId, projectId)),
  ])

  return {
    ...project,
    tasks: projectTasks,
    members: projectMembers,
  }
})
