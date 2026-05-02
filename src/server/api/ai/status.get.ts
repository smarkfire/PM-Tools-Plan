export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  return {
    available: !!(config.deepseekApiKey || config.qwenApiKey),
    providers: [
      { name: 'deepseek', configured: !!config.deepseekApiKey },
      { name: 'qwen', configured: !!config.qwenApiKey }
    ]
  }
})
