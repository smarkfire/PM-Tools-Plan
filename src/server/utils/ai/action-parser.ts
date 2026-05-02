export interface ParsedAction {
  type: 'assign_task' | 'update_duration' | 'update_status' | 'add_note' | 'set_priority'
  entityId: string
  params: Record<string, any>
  description: string
}

export interface ParseSchemaField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required?: boolean
}

export async function parseUserAction(input: string, tasks: any[]): Promise<ParsedAction | null> {
  const taskList = tasks.map((t, i) => `${i + 1}. ${t.name} (ID: ${t.id})`).join('\n')

  const systemPrompt = `你是一个操作意图解析器。请根据用户输入，识别他们想要执行的操作。

支持的操作类型:
1. assign_task - 分配任务
   示例: "把任务A分配给张三"
   参数: taskId, assigneeName

2. update_duration - 修改工期
   示例: "把任务A的工期改为5天"
   参数: taskId, duration

3. update_status - 修改状态
   示例: "把任务A标记为已完成"
   参数: taskId, status

4. add_note - 添加备注
   示例: "给任务A添加备注:需要额外资源"
   参数: taskId, note

5. set_priority - 设置优先级
   示例: "把任务A优先级设为高"
   参数: taskId, priority

任务列表:
${taskList}

返回JSON格式:
{
  "type": "assign_task",
  "entityId": "task-123",
  "params": { "assigneeName": "张三" },
  "description": "将'需求分析'分配给张三"
}

如果无法识别操作，返回 null。`

  const { callAI } = await import('./client')
  const { parseAIJsonResponse } = await import('./parser')

  try {
    const response = await callAI(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input }
      ],
      { provider: 'deepseek', maxTokens: 500, temperature: 0.1 }
    )

    if (!response || !response.content) return null

    if (response.content.trim().toLowerCase() === 'null') return null

    const parsed = parseAIJsonResponse<ParsedAction>(response.content, {
      type: { type: 'string', required: true },
      params: { type: 'object', required: true }
    })

    return parsed
  } catch (error) {
    console.error('Parse action error:', error)
    return null
  }
}

export function validateAction(action: ParsedAction, tasks: any[]): { valid: boolean; error?: string } {
  const task = tasks.find(t => t.id === action.entityId)
  if (!task) {
    return { valid: false, error: '任务不存在' }
  }

  switch (action.type) {
    case 'assign_task':
      if (!action.params.assigneeName) {
        return { valid: false, error: '请指定分配给谁' }
      }
      break
    case 'update_duration':
      if (!action.params.duration || action.params.duration <= 0) {
        return { valid: false, error: '工期必须大于0' }
      }
      break
    case 'update_status': {
      const validStatuses = ['待办', '进行中', '已完成']
      if (!validStatuses.includes(action.params.status)) {
        return { valid: false, error: `无效的状态，可选: ${validStatuses.join(', ')}` }
      }
      break
    }
    case 'add_note':
      if (!action.params.note) {
        return { valid: false, error: '备注内容不能为空' }
      }
      break
    case 'set_priority': {
      const validPriorities = ['高', '中', '低']
      if (!validPriorities.includes(action.params.priority)) {
        return { valid: false, error: `无效的优先级，可选: ${validPriorities.join(', ')}` }
      }
      break
    }
    default:
      return { valid: false, error: `不支持的操作类型: ${action.type}` }
  }

  return { valid: true }
}
