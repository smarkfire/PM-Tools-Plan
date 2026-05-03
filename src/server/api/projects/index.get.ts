import { eq, desc } from 'drizzle-orm'
import { projects } from '~/server/db/schema'
import { db } from '~/server/db'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId

  const result = await db.select().from(projects)
    .where(eq(projects.ownerId, userId))
    .orderBy(desc(projects.updatedAt))

  return result
})
