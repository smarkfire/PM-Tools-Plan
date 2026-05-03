import { verifyRefreshToken, generateAccessToken } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const refreshToken = getCookie(event, 'refresh_token')

  if (!refreshToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No refresh token',
    })
  }

  const payload = verifyRefreshToken(refreshToken)
  if (!payload) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid or expired refresh token',
    })
  }

  const accessToken = generateAccessToken({
    userId: payload.userId,
    email: payload.email,
  })

  return { accessToken }
})
