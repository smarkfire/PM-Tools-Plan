const cache = new Map<string, { data: any; expires: number }>()

const DEFAULT_TTL = 3600000

export function setCache(key: string, data: any, ttl: number = DEFAULT_TTL) {
  cache.set(key, {
    data,
    expires: Date.now() + ttl
  })
}

export function getCache<T = any>(key: string): T | null {
  const item = cache.get(key)
  if (!item) return null

  if (Date.now() > item.expires) {
    cache.delete(key)
    return null
  }

  return item.data as T
}

export function deleteCache(key: string) {
  cache.delete(key)
}

export function clearCache() {
  cache.clear()
}

export function getCacheStats() {
  let validCount = 0
  let expiredCount = 0
  const now = Date.now()

  cache.forEach((item) => {
    if (now > item.expires) {
      expiredCount++
    } else {
      validCount++
    }
  })

  return {
    total: cache.size,
    valid: validCount,
    expired: expiredCount
  }
}

setInterval(() => {
  const now = Date.now()
  cache.forEach((item, key) => {
    if (now > item.expires) {
      cache.delete(key)
    }
  })
}, 600000)
