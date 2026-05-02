export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  return {
    providers: [
      {
        name: 'deepseek',
        configured: !!config.deepseekApiKey,
        models: ['deepseek-chat', 'deepseek-coder']
      }
    ]
  }
})
