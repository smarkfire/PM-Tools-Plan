import type { Message, AIResponse, AIProviderOptions } from './types'

interface OpenAIChatResponse {
  choices: Array<{ message: { content: string } }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function callAI(
  messages: Message[],
  options?: AIProviderOptions
): Promise<AIResponse> {
  const config = useRuntimeConfig()

  const providerConfig = {
    deepseek: {
      baseURL: config.deepseekApiBase || 'https://api.deepseek.com',
      apiKey: config.deepseekApiKey,
      model: options?.model || config.deepseekModel || 'deepseek-chat'
    }
  }

  const { baseURL, apiKey, model } = providerConfig.deepseek

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Deepseek API Key not configured. Please set it in .env file.'
    })
  }

  try {
    const response = await $fetch<OpenAIChatResponse>('/chat/completions', {
      baseURL,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: {
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000
      }
    })

    return {
      content: response.choices[0]?.message?.content || '',
      model,
      provider: 'deepseek',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      }
    }
  } catch (error: any) {
    console.error('AI API error (deepseek):', error?.message || error)
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: `Failed to call Deepseek API: ${error?.message || 'Unknown error'}`
    })
  }
}
