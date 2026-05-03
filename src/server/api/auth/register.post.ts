import { eq } from 'drizzle-orm'
import { users } from '~/server/db/schema'
import { db } from '~/server/db'
import { hashPassword, generateTokenPair } from '~/server/utils/auth'
import { validateEmail, validatePassword, sanitizeString } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { email, password, displayName } = body

  if (!email || !password || !displayName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'email, password and displayName are required',
    })
  }

  if (!validateEmail(email)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid email format',
    })
  }

  const pwdResult = validatePassword(password)
  if (!pwdResult.valid) {
    throw createError({
      statusCode: 400,
      statusMessage: pwdResult.message,
    })
  }

  const sanitizedName = sanitizeString(displayName, 100)
  if (!sanitizedName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Display name is required',
    })
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1)
  if (existing.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Email already registered',
    })
  }

  const passwordHash = await hashPassword(password)

  const [newUser] = await db.insert(users).values({
    email: email.toLowerCase().trim(),
    passwordHash,
    displayName: sanitizedName,
  }).returning({
    id: users.id,
    email: users.email,
    displayName: users.displayName,
    avatarUrl: users.avatarUrl,
  })

  const tokens = generateTokenPair({
    userId: newUser.id,
    email: newUser.email,
  })

  setCookie(event, 'refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })

  return {
    accessToken: tokens.accessToken,
    user: newUser,
  }
})
