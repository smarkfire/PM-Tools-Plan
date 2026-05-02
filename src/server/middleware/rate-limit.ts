const rateLimitMap = new Map<string, number[]>()

const WINDOW_MS = 60 * 1000
const MAX_REQUESTS = 30
const AI_MAX_REQUESTS = 10

function getClientIP(event: any): string {
  const headers = event.node?.req?.headers || {}
  return headers['x-forwarded-for']?.split(',')[0]?.trim()
    || headers['x-real-ip']
    || event.node?.req?.socket?.remoteAddress
    || 'unknown'
}

function cleanupExpired(ip: string) {
  const now = Date.now()
  const requests = rateLimitMap.get(ip)
  if (!requests) return
  const recent = requests.filter(t => now - t < WINDOW_MS)
  if (recent.length === 0) {
    rateLimitMap.delete(ip)
  } else {
    rateLimitMap.set(ip, recent)
  }
}

export default defineEventHandler(async (event) => {
  const url = event.node?.req?.url || ''
  if (!url.startsWith('/api/ai/')) return

  const ip = getClientIP(event)
  cleanupExpired(ip)

  const now = Date.now()
  const requests = rateLimitMap.get(ip) || []

  const limit = url.includes('/chat') ? AI_MAX_REQUESTS : MAX_REQUESTS

  if (requests.length >= limit) {
    throw createError({
      statusCode: 429,
      statusMessage: '请求过于频繁，请稍后再试'
    })
  }

  requests.push(now)
  rateLimitMap.set(ip, requests)
})
