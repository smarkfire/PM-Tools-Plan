import type { AIProviderOptions } from './types'

type AITaskType = 'task-breakdown' | 'duration-estimation' | 'chat' | 'health-diagnosis' | 'report-generation'

interface AIProviderConfig {
  provider: 'deepseek' | 'qwen'
  model: string
}

const modelConfig: Record<AITaskType, AIProviderConfig> = {
  'task-breakdown': { provider: 'deepseek', model: 'deepseek-chat' },
  'duration-estimation': { provider: 'qwen', model: 'qwen-max' },
  'chat': { provider: 'qwen', model: 'qwen-turbo' },
  'health-diagnosis': { provider: 'deepseek', model: 'deepseek-chat' },
  'report-generation': { provider: 'qwen', model: 'qwen-plus' }
}

export function selectAIProvider(taskType: AITaskType): AIProviderOptions {
  const config = modelConfig[taskType]
  return {
    provider: config.provider,
    model: config.model
  }
}

export type { AITaskType }
