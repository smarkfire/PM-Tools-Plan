export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  return {
    available: !!config.deepseekApiKey,
    providers: [
      { name: 'deepseek', configured: !!config.deepseekApiKey }
    ]
  }
})
