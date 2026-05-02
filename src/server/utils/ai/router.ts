import type { AIProviderOptions } from './types'

type AITaskType = 'task-breakdown' | 'duration-estimation' | 'chat' | 'health-diagnosis' | 'report-generation'

interface AIProviderConfig {
  provider: 'deepseek'
  model: string
}

const modelConfig: Record<AITaskType, AIProviderConfig> = {
  'task-breakdown': { provider: 'deepseek', model: 'deepseek-chat' },
  'duration-estimation': { provider: 'deepseek', model: 'deepseek-chat' },
  'chat': { provider: 'deepseek', model: 'deepseek-chat' },
  'health-diagnosis': { provider: 'deepseek', model: 'deepseek-chat' },
  'report-generation': { provider: 'deepseek', model: 'deepseek-chat' }
}

export function selectAIProvider(taskType: AITaskType): AIProviderOptions {
  const config = modelConfig[taskType]
  return {
    provider: config.provider,
    model: config.model
  }
}

export type { AITaskType }
