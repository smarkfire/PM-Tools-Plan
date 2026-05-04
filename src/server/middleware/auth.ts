import { verifyAccessToken } from '~/server/utils/auth'

const PUBLIC_ROUTES = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/health',
  '/api/share/',
  '/api/ai/status',
  '/api/templates/market',
]

function isPublicRoute(url: string): boolean {
  return PUBLIC_ROUTES.some((route) => url.startsWith(route))
}

export default defineEventHandler(async (event) => {
  const url = event.node.req.url || ''
  if (!url.startsWith('/api/')) return

  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

  if (token) {
    const payload = verifyAccessToken(token)
    if (payload) {
      event.context.userId = payload.userId
      event.context.userEmail = payload.email
    }
  }

  if (isPublicRoute(url)) return

  if (!event.context.userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Missing authorization token',
    })
  }
})
