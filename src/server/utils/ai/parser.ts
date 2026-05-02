export interface ParseSchemaField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required?: boolean
}

export type ParseSchema = Record<string, ParseSchemaField | { type: 'array'; required?: boolean }>

export function parseAIJsonResponse<T = any>(content: string, schema?: ParseSchema): T {
  let jsonStr = content.trim()

  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim()
  }

  let parsed: any = null

  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    // continue to try extraction
  }

  if (!parsed) {
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const candidate = jsonMatch[0]
      try {
        parsed = JSON.parse(candidate)
      } catch {
        parsed = extractFirstValidJsonObject(jsonStr)
      }
    }
  }

  if (!parsed) {
    const preview = jsonStr.length > 200 ? jsonStr.substring(0, 200) + '...' : jsonStr
    console.error('Failed to parse AI JSON response. Raw content preview:', preview)
    throw new Error('AI 返回的内容无法解析为 JSON')
  }

  if (schema) {
    for (const [key, field] of Object.entries(schema)) {
      if (field.required && (parsed[key] === undefined || parsed[key] === null)) {
        throw new Error(`缺少必填字段: ${key}`)
      }
      if (parsed[key] !== undefined && field.type) {
        const actualType = Array.isArray(parsed[key]) ? 'array' : typeof parsed[key]
        if (actualType !== field.type) {
          throw new Error(`字段 ${key} 类型错误: 期望 ${field.type}, 实际 ${actualType}`)
        }
      }
    }
  }

  return parsed as T
}

function extractFirstValidJsonObject(text: string): any {
  let depth = 0
  let startIdx = -1
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (depth === 0) startIdx = i
      depth++
    } else if (text[i] === '}') {
      depth--
      if (depth === 0 && startIdx !== -1) {
        const segment = text.substring(startIdx, i + 1)
        try {
          return JSON.parse(segment)
        } catch {
          startIdx = -1
        }
      }
    }
  }
  return null
}

export function countTasks(tasks: any[]): number {
  let count = 0
  for (const task of tasks) {
    count++
    if (task.children && Array.isArray(task.children)) {
      count += countTasks(task.children)
    }
  }
  return count
}

export function calculateTotalDuration(tasks: any[]): number {
  return tasks.reduce((max, task) => {
    const duration = task.duration || 0
    const childrenDuration = task.children
      ? calculateTotalDuration(task.children)
      : 0
    return Math.max(max, duration + childrenDuration)
  }, 0)
}

export function findCriticalPathCount(tasks: any[]): number {
  let count = 0
  for (const task of tasks) {
    if (task.dependencies && Array.isArray(task.dependencies) && task.dependencies.length > 0) {
      count++
    }
    if (task.children && Array.isArray(task.children)) {
      count += findCriticalPathCount(task.children)
    }
  }
  return count
}
