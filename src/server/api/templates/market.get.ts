import { eq } from 'drizzle-orm'
import { promptTemplates, projectTemplates } from '~/server/db/schema'
import { db } from '~/server/db'

export default defineEventHandler(async (event) => {
  const [prompts, projects] = await Promise.all([
    db.select().from(promptTemplates)
      .where(eq(promptTemplates.isOfficial, true))
      .orderBy(promptTemplates.sortOrder, promptTemplates.createdAt),
    db.select().from(projectTemplates)
      .where(eq(projectTemplates.isOfficial, true))
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
