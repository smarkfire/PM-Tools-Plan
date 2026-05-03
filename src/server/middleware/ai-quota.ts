import { checkAIQuota } from '~/server/utils/ai/quota'

export default defineEventHandler(async (event) => {
  const url = event.node.req.url || ''
  if (!url.startsWith('/api/ai/')) return

  if (url === '/api/ai/config' || url === '/api/ai/status' || url === '/api/ai/usage') return

  const userId = event.context.userId
  if (!userId) return

  const quota = await checkAIQuota(userId)
  if (!quota.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: `AI daily quota exceeded (${quota.quota} calls/day). Remaining: 0`,
    })
  }

  setResponseHeader(event, 'X-AI-Quota-Remaining', quota.remaining.toString())
  setResponseHeader(event, 'X-AI-Quota-Limit', quota.quota.toString())
})
