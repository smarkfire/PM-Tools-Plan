const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC)\b)/i,
  /(--|;|\/\*|\*\/|xp_|0x)/i,
  /('(\s)*(OR|AND)(\s)*')/i,
]

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email)
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' }
  }
  if (password.length > 128) {
    return { valid: false, message: 'Password must be less than 128 characters' }
  }
  return { valid: true }
}

export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(/[<>]/g, '')
    .slice(0, maxLength)
    .trim()
}

export const sanitizeInput = sanitizeString

export function detectSqlInjection(input: string): boolean {
  if (typeof input !== 'string') return false
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input))
}

export function validateProjectName(name: string): { valid: boolean; message?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: 'Project name is required' }
  }
  const sanitized = name.trim()
  if (sanitized.length === 0) {
    return { valid: false, message: 'Project name cannot be empty' }
  }
  if (sanitized.length > 200) {
    return { valid: false, message: 'Project name must be less than 200 characters' }
  }
  return { valid: true }
}

export function validateTaskName(name: string): { valid: boolean; message?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: 'Task name is required' }
  }
  const sanitized = name.trim()
  if (sanitized.length === 0) {
    return { valid: false, message: 'Task name cannot be empty' }
  }
  if (sanitized.length > 200) {
    return { valid: false, message: 'Task name must be less than 200 characters' }
  }
  return { valid: true }
}

export function validateDate(dateStr: string | null | undefined): boolean {
  if (!dateStr) return true
  const d = new Date(dateStr)
  return !isNaN(d.getTime())
}

export function validateUuid(id: string): boolean {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return UUID_REGEX.test(id)
}

export function validatePositiveNumber(value: unknown, min: number = 0, max: number = Infinity): { valid: boolean; value?: number; message?: string } {
  const num = Number(value)
  if (isNaN(num)) {
    return { valid: false, message: 'Value must be a number' }
  }
  if (num < min) {
    return { valid: false, message: `Value must be at least ${min}` }
  }
  if (num > max) {
    return { valid: false, message: `Value must be at most ${max}` }
  }
  return { valid: true, value: num }
}
