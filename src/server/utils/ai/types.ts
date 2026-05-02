export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  content: string
  model: string
  provider: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface AIProviderOptions {
  provider?: 'deepseek'
  model?: string
  temperature?: number
  maxTokens?: number
}
