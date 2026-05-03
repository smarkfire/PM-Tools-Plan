import { eq, and, gte, sql } from 'drizzle-orm'
import { aiUsageLogs } from '~/server/db/schema'
import { db } from '~/server/db'

const DAILY_QUOTA = parseInt(process.env.AI_DAILY_QUOTA || '50', 10)

export async function checkAIQuota(userId: string): Promise<{ allowed: boolean; remaining: number; quota: number }> {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [result] = await db.select({ count: sql<number>`count(*)::int` })
    .from(aiUsageLogs)
    .where(and(eq(aiUsageLogs.userId, userId), gte(aiUsageLogs.createdAt, todayStart)))

  const used = result?.count || 0
  return {
    allowed: used < DAILY_QUOTA,
    remaining: Math.max(0, DAILY_QUOTA - used),
    quota: DAILY_QUOTA,
  }
}

export async function logAIUsage(params: {
  userId: string
  action: string
  model?: string
  tokenInput?: number
  tokenOutput?: number
  durationMs?: number
  success?: boolean
  errorMessage?: string
}): Promise<void> {
  await db.insert(aiUsageLogs).values({
    userId: params.userId,
    action: params.action,
    model: params.model || null,
    tokenInput: params.tokenInput || 0,
    tokenOutput: params.tokenOutput || 0,
    durationMs: params.durationMs || 0,
    success: params.success !== false,
    errorMessage: params.errorMessage || null,
  })
}
