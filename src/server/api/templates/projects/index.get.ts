import { or, eq } from 'drizzle-orm'
import { projectTemplates } from '~/server/db/schema'
import { db } from '~/server/db'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId

  const list = await db.select().from(projectTemplates)
    .where(or(eq(projectTemplates.isOfficial, true), eq(projectTemplates.userId, userId)))
    .orderBy(projectTemplates.isOfficial, projectTemplates.usageCount, projectTemplates.createdAt)

  return list
})
