import { eq, and } from 'drizzle-orm'
import { shares } from '~/server/db/schema'
import { db } from '~/server/db'
import { verifyPassword } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Share token is required' })
  }

  const body = await readBody(event)
  if (!body?.password) {
    throw createError({ statusCode: 400, statusMessage: 'Password is required' })
  }

  const [share] = await db.select().from(shares)
    .where(and(eq(shares.shareToken, token), eq(shares.isActive, true)))
    .limit(1)

  if (!share) {
    throw createError({ statusCode: 404, statusMessage: 'Share not found' })
  }

  if (!share.passwordHash) {
    return { valid: true }
  }

  const valid = await verifyPassword(body.password, share.passwordHash)

  return { valid }
})
