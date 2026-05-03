import { or, eq } from 'drizzle-orm'
import { promptTemplates } from '~/server/db/schema'
import { db } from '~/server/db'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId

  const list = await db.select().from(promptTemplates)
    .where(or(eq(promptTemplates.isOfficial, true), eq(promptTemplates.userId, userId)))
    .orderBy(promptTemplates.isOfficial, promptTemplates.sortOrder, promptTemplates.createdAt)

  return list
})
