import { eq, and } from 'drizzle-orm'
import { projects, tasks, members, shares } from '~/server/db/schema'
import { db } from '~/server/db'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Share token is required' })
  }

  const [share] = await db.select().from(shares)
    .where(and(eq(shares.shareToken, token), eq(shares.isActive, true)))
    .limit(1)

  if (!share) {
    throw createError({ statusCode: 404, statusMessage: 'Share not found or expired' })
  }

  if (share.expiresAt && new Date() > share.expiresAt) {
    throw createError({ statusCode: 410, statusMessage: 'Share link has expired' })
  }

  if (share.passwordHash) {
    const body = await readBody(event).catch(() => null)
    if (!body?.password) {
      return { requiresPassword: true }
    }
    const { verifyPassword } = await import('~/server/utils/auth')
    const valid = await verifyPassword(body.password, share.passwordHash)
    if (!valid) {
      throw createError({ statusCode: 403, statusMessage: 'Incorrect password' })
    }
  }

  await db.update(shares)
    .set({ viewCount: share.viewCount + 1 })
    .where(eq(shares.id, share.id))

  const [project, projectTasks, projectMembers] = await Promise.all([
    db.select().from(projects)
      .where(eq(projects.id, share.projectId))
      .limit(1),
    db.select().from(tasks)
      .where(eq(tasks.projectId, share.projectId))
      .orderBy(tasks.sortOrder),
    db.select({
      name: members.name,
      email: members.email,
      role: members.role,
    }).from(members)
      .where(eq(members.projectId, share.projectId)),
  ])

  return {
    project: {
      name: project?.name,
      description: project?.description,
      startDate: project?.startDate,
      endDate: project?.endDate,
    },
    tasks: projectTasks.map(t => ({
      id: t.id,
      name: t.name,
      wbs: t.wbsCode,
      startDate: t.startDate,
      endDate: t.endDate,
      duration: t.duration,
      deliverable: t.deliverable,
      assignee: t.assignee,
      priority: t.priority,
      status: t.status,
      isMilestone: t.isMilestone,
      description: t.description,
      parentId: t.parentId,
    })),
    members: projectMembers,
  }
})
