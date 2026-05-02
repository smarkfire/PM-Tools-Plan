export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  return {
    providers: [
      {
        name: 'deepseek',
        configured: !!config.deepseekApiKey,
        models: ['deepseek-chat', 'deepseek-coder']
      },
      {
        name: 'qwen',
        configured: !!config.qwenApiKey,
        models: ['qwen-max', 'qwen-plus', 'qwen-turbo']
      }
    ]
  }
})
