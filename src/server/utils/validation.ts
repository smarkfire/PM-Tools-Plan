export function validateApiKey(apiKey: string): { valid: boolean; message?: string } {
  if (!apiKey || typeof apiKey !== 'string') {
    return { valid: false, message: 'API Key 不能为空' }
  }

  if (apiKey.length < 20) {
    return { valid: false, message: 'API Key 长度不足' }
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(apiKey)) {
    return { valid: false, message: 'API Key 包含非法字符' }
  }

  return { valid: true }
}

export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return ''

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*on\w+\s*=/gi, (match) => match.replace(/on\w+\s*=/gi, ''))
    .trim()
}

export function validateProjectName(name: string): { valid: boolean; message?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: '项目名称不能为空' }
  }

  const sanitized = sanitizeInput(name)
  if (sanitized.length === 0) {
    return { valid: false, message: '项目名称包含非法内容' }
  }

  if (sanitized.length > 100) {
    return { valid: false, message: '项目名称不能超过100个字符' }
  }

  return { valid: true }
}

export function validateTaskName(name: string): { valid: boolean; message?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: '任务名称不能为空' }
  }

  const sanitized = sanitizeInput(name)
  if (sanitized.length === 0) {
    return { valid: false, message: '任务名称包含非法内容' }
  }

  if (sanitized.length > 200) {
    return { valid: false, message: '任务名称不能超过200个字符' }
  }

  return { valid: true }
}

export function validateDate(dateStr: string): { valid: boolean; message?: string } {
  if (!dateStr) {
    return { valid: false, message: '日期不能为空' }
  }

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    return { valid: false, message: '日期格式无效' }
  }

  return { valid: true }
}

export function validatePositiveNumber(value: number, fieldName: string): { valid: boolean; message?: string } {
  if (value === undefined || value === null) {
    return { valid: false, message: `${fieldName}不能为空` }
  }

  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, message: `${fieldName}必须是数字` }
  }

  if (value <= 0) {
    return { valid: false, message: `${fieldName}必须大于0` }
  }

  return { valid: true }
}
