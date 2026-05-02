export function isAIAvailable(): boolean {
  const config = useRuntimeConfig()
  return !!(config.deepseekApiKey || config.qwenApiKey)
}
