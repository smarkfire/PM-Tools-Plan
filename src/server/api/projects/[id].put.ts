import { eq, and } from 'drizzle-orm'
import { projects, members } from '~/server/db/schema'
import { db } from '~/server/db'
import { sanitizeString } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const projectId = getRouterParam(event, 'id')

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Project ID is required' })
  }

  const body = await readBody(event)
  const { name, description, startDate, endDate, members: membersList } = body

  const [existing] = await db.select({ id: projects.id }).from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, userId)))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  if (name !== undefined || description !== undefined || startDate !== undefined || endDate !== undefined) {
    await db.update(projects)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(startDate !== undefined && { startDate }),
        ...(endDate !== undefined && { endDate }),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
  }

  if (membersList && Array.isArray(membersList)) {
    const existingMembers = await db.select({ id: members.id }).from(members)
      .where(eq(members.projectId, projectId))
    const existingMemberIds = new Set(existingMembers.map(m => m.id))

    const incomingMemberIds = new Set<string>()

    for (const member of membersList) {
      if (member.id && existingMemberIds.has(member.id)) {
        incomingMemberIds.add(member.id)
        await db.update(members)
          .set({
            name: sanitizeString(member.name || '', 100),
            email: member.email ? sanitizeString(member.email, 255) : null,
            role: member.role ? sanitizeString(member.role, 50) : null,
            phone: member.phone ? sanitizeString(member.phone, 50) : null,
          })
          .where(eq(members.id, member.id))
      } else if (member.name) {
        const [newMember] = await db.insert(members).values({
          projectId,
          name: sanitizeString(member.name, 100),
          email: member.email ? sanitizeString(member.email, 255) : null,
          role: member.role ? sanitizeString(member.role, 50) : null,
          phone: member.phone ? sanitizeString(member.phone, 50) : null,
        }).returning()
        if (newMember) {
          incomingMemberIds.add(newMember.id)
        }
      }
    }

    const idsToDelete = [...existingMemberIds].filter(id => !incomingMemberIds.has(id))
    for (const id of idsToDelete) {
      await db.delete(members).where(eq(members.id, id))
    }
  }

  const [updated] = await db.select().from(projects)
    .where(eq(projects.id, projectId))
    .limit(1)

  return updated
})
