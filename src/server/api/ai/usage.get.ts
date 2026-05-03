import { eq, and, gte, sql } from 'drizzle-orm'
import { aiUsageLogs } from '~/server/db/schema'
import { db } from '~/server/db'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [totalCalls, recentCalls, actionBreakdown, dailyUsage] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` })
      .from(aiUsageLogs)
      .where(eq(aiUsageLogs.userId, userId)),
    db.select({ count: sql<number>`count(*)::int` })
      .from(aiUsageLogs)
      .where(and(eq(aiUsageLogs.userId, userId), gte(aiUsageLogs.createdAt, thirtyDaysAgo))),
    db.select({
      action: aiUsageLogs.action,
      count: sql<number>`count(*)::int`,
      avgDuration: sql<number>`avg(${aiUsageLogs.durationMs})::int`,
    })
      .from(aiUsageLogs)
      .where(and(eq(aiUsageLogs.userId, userId), gte(aiUsageLogs.createdAt, thirtyDaysAgo)))
      .groupBy(aiUsageLogs.action)
      .orderBy(sql`count(*) desc`),
    db.select({
      date: sql<string>`date(${aiUsageLogs.createdAt})`,
      count: sql<number>`count(*)::int`,
      tokens: sql<number>`sum(coalesce(${aiUsageLogs.tokenInput}, 0) + coalesce(${aiUsageLogs.tokenOutput}, 0))::int`,
    })
      .from(aiUsageLogs)
      .where(and(eq(aiUsageLogs.userId, userId), gte(aiUsageLogs.createdAt, thirtyDaysAgo)))
      .groupBy(sql`date(${aiUsageLogs.createdAt})`)
      .orderBy(sql`date(${aiUsageLogs.createdAt}) desc`),
  ])

  const DAILY_QUOTA = 50
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const [todayUsage] = await db.select({ count: sql<number>`count(*)::int` })
    .from(aiUsageLogs)
    .where(and(eq(aiUsageLogs.userId, userId), gte(aiUsageLogs.createdAt, todayStart)))

  return {
    totalCalls: totalCalls[0]?.count || 0,
    recentCalls30d: recentCalls[0]?.count || 0,
    todayCalls: todayUsage?.count || 0,
    dailyQuota: DAILY_QUOTA,
    remainingToday: Math.max(0, DAILY_QUOTA - (todayUsage?.count || 0)),
    actionBreakdown,
    dailyUsage,
  }
})
