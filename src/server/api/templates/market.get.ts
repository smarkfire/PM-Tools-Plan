import { eq, or } from 'drizzle-orm'
import { promptTemplates, projectTemplates } from '~/server/db/schema'
import { db } from '~/server/db'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId

  const promptFilter = userId
    ? or(eq(promptTemplates.isOfficial, true), eq(promptTemplates.userId, userId))
    : eq(promptTemplates.isOfficial, true)

  const projectFilter = userId
    ? or(eq(projectTemplates.isOfficial, true), eq(projectTemplates.userId, userId))
    : eq(projectTemplates.isOfficial, true)

  const [prompts, projects] = await Promise.all([
    db.select().from(promptTemplates)
      .where(promptFilter)
      .orderBy(promptTemplates.sortOrder, promptTemplates.createdAt),
    db.select().from(projectTemplates)
      .where(projectFilter)
      .orderBy(projectTemplates.usageCount, projectTemplates.createdAt),
  ])

  const promptCategories = [...new Set(prompts.map(p => p.category))]
  const projectIndustries = [...new Set(projects.map(p => p.industry).filter(Boolean))]

  return {
    prompts,
    projects,
    promptCategories,
    projectIndustries,
  }
})
