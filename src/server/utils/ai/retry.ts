import type { Message, AIResponse, AIProviderOptions } from './types'

export async function callAIWithRetry(
  messages: Message[],
  options?: AIProviderOptions,
  maxRetries = 3
): Promise<AIResponse> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await callAI(messages, options)
    } catch (error: any) {
      if (i === maxRetries - 1) throw error

      if (error?.statusCode === 429) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      } else if (error?.statusCode >= 500) {
        continue
      } else {
        throw error
      }
    }
  }
  throw new Error('Max retries exceeded')
}
