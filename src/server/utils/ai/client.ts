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

  const provider = options?.provider || 'deepseek'

  const providerConfig = {
    deepseek: {
      baseURL: config.deepseekApiBase || 'https://api.deepseek.com',
      apiKey: config.deepseekApiKey,
      model: options?.model || config.deepseekModel || 'deepseek-chat'
    },
    qwen: {
      baseURL: config.qwenApiBase || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: config.qwenApiKey,
      model: options?.model || config.qwenModel || 'qwen-max'
    }
  }

  const { baseURL, apiKey, model } = providerConfig[provider]

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: `${provider} API Key not configured. Please set it in .env file.`
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
      provider,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      }
    }
  } catch (error: any) {
    console.error(`AI API error (${provider}):`, error?.message || error)
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: `Failed to call ${provider} API: ${error?.message || 'Unknown error'}`
    })
  }
}
