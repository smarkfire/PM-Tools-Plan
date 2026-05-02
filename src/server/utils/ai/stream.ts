import type { Message } from '~/server/utils/ai/types'

export interface AIProviderOptions {
  provider?: string
  model?: string
  temperature?: number
  maxTokens?: number
}

export async function callAIStream(
  messages: Message[],
  options?: AIProviderOptions
): Promise<ReadableStream<Uint8Array>> {
  const config = useRuntimeConfig()

  const baseURL = config.deepseekApiBase || 'https://api.deepseek.com'
  const apiKey = config.deepseekApiKey
  const model = options?.model || config.deepseekModel || 'deepseek-chat'

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Deepseek API Key not configured'
    })
  }

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
      stream: true
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw createError({
      statusCode: response.status,
      statusMessage: `Deepseek API error: ${errorText}`
    })
  }

  return response.body as ReadableStream<Uint8Array>
}

export function createSSEStream(
  aiStream: ReadableStream<Uint8Array>
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let buffer = ''

  return new ReadableStream({
    async start(controller) {
      const reader = aiStream.getReader()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith('data: ')) continue

            const data = trimmed.slice(6)
            if (data === '[DONE]') {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              continue
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content || ''
              if (content) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                )
              }
            } catch {
              // skip malformed chunks
            }
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (error: any) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
        )
        controller.close()
      }
    }
  })
}
