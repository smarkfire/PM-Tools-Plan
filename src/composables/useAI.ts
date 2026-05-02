export function useAIAvailability() {
  const aiAvailable = ref(false)
  const providers = ref<Array<{ name: string; configured: boolean }>>([])

  onMounted(async () => {
    try {
      const data = await $fetch<{ available: boolean; providers: Array<{ name: string; configured: boolean }> }>('/api/ai/status')
      aiAvailable.value = data.available
      providers.value = data.providers
    } catch {
      aiAvailable.value = false
    }
  })

  return { aiAvailable, providers }
}
