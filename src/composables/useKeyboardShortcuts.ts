export function useKeyboardShortcuts() {
  const shortcuts = new Map<string, (e: KeyboardEvent) => void>()

  const register = (key: string, handler: (e: KeyboardEvent) => void) => {
    shortcuts.set(key.toLowerCase(), handler)
  }

  const unregister = (key: string) => {
    shortcuts.delete(key.toLowerCase())
  }

  const handleKeydown = (e: KeyboardEvent) => {
    const parts: string[] = []
    if (e.ctrlKey || e.metaKey) parts.push('ctrl')
    if (e.shiftKey) parts.push('shift')
    if (e.altKey) parts.push('alt')
    parts.push(e.key.toLowerCase())
    const combo = parts.join('+')

    const handler = shortcuts.get(combo)
    if (handler) {
      e.preventDefault()
      handler(e)
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
    shortcuts.clear()
  })

  return { register, unregister }
}
