const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

interface RateLimitOptions {
  maxRequests: number
  windowMs: number
}

const DEFAULT_OPTIONS: RateLimitOptions = {
  maxRequests: 60,
  windowMs: 60 * 1000,
}

const ROUTE_LIMITS: Record<string, RateLimitOptions> = {
  '/api/auth/register': { maxRequests: 5, windowMs: 60 * 1000 },
  '/api/auth/login': { maxRequests: 10, windowMs: 60 * 1000 },
  '/api/auth/refresh': { maxRequests: 20, windowMs: 60 * 1000 },
  '/api/ai/': { maxRequests: 10, windowMs: 60 * 1000 },
  '/api/migrate/': { maxRequests: 3, windowMs: 60 * 1000 },
}

function getClientIp(event: any): string {
  return (
    getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ||
    getHeader(event, 'x-real-ip') ||
    event.node.req.socket?.remoteAddress ||
    'unknown'
  )
}

function getRateLimitKey(event: any, url: string): string {
  const ip = getClientIp(event)
  const userId = event.context?.userId
  return userId ? `${userId}:${url}` : `${ip}:${url}`
}

function getLimitForRoute(url: string): RateLimitOptions {
  for (const [route, options] of Object.entries(ROUTE_LIMITS)) {
    if (url.startsWith(route)) return options
  }
  return DEFAULT_OPTIONS
}

setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap) {
    if (now > value.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}, 60 * 1000)

export default defineEventHandler(async (event) => {
  const url = event.node.req.url || ''
  if (!url.startsWith('/api/')) return
  if (url === '/api/health') return

  const options = getLimitForRoute(url)
  const key = getRateLimitKey(event, url)
  const now = Date.now()

  let entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + options.windowMs }
    rateLimitMap.set(key, entry)
  }

  entry.count++

  setResponseHeader(event, 'X-RateLimit-Limit', options.maxRequests.toString())
  setResponseHeader(event, 'X-RateLimit-Remaining', Math.max(0, options.maxRequests - entry.count).toString())
  setResponseHeader(event, 'X-RateLimit-Reset', new Date(entry.resetAt).toISOString())

  if (entry.count > options.maxRequests) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests, please try again later',
    })
  }
})
