import { defineStore } from 'pinia'

const STORAGE_KEY = 'plan-tools-ui'
const LOCALE_STORAGE_KEY = 'plan-tools-locale'
const I18N_COOKIE_KEY = 'i18n_locale'

interface LocaleOption {
  code: string
  name: string
  flag: string
}

const availableLocales: LocaleOption[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' }
]

function getCurrentLocale(): string {
  try {
    const cookieMatch = document.cookie.match(new RegExp('(?:^|;\\s*)' + I18N_COOKIE_KEY + '=([^;]*)'))
    if (cookieMatch) {
      const val = decodeURIComponent(cookieMatch[1])
      if (val === 'en' || val === 'zh-CN') return val
    }
  } catch {
    // ignore
  }
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (saved && (saved === 'en' || saved === 'zh-CN')) {
      return saved
    }
  } catch {
    // ignore
  }
  return 'zh-CN'
}

function persistLocale(locale: string): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // ignore
  }
}

interface UIState {
  splitRatio: number
  isSplitPaneDragging: boolean
  autoSaveEnabled: boolean
  autoSaveInterval: number
  locale: string
}

export const useUIStore = defineStore('ui', {
  state: (): UIState => ({
    splitRatio: 0.4,
    isSplitPaneDragging: false,
    autoSaveEnabled: true,
    autoSaveInterval: 30000,
    locale: getCurrentLocale()
  }),

  getters: {
    leftPaneWidth: (state): string => `${state.splitRatio * 100}%`,
    rightPaneWidth: (state): string => `${(1 - state.splitRatio) * 100}%`,
    currentLocale: (state): string => state.locale,
    availableLocales: (): LocaleOption[] => availableLocales
  },

  actions: {
    setSplitRatio(ratio: number): void {
      this.splitRatio = Math.max(0.2, Math.min(0.8, ratio))
      this.saveToLocalStorage()
    },

    setLocale(locale: string): void {
      this.locale = locale
      persistLocale(locale)
      this.saveToLocalStorage()
    },

    startDragging(): void {
      this.isSplitPaneDragging = true
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },

    stopDragging(): void {
      this.isSplitPaneDragging = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    },

    saveToLocalStorage(): void {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          splitRatio: this.splitRatio,
          autoSaveEnabled: this.autoSaveEnabled,
          autoSaveInterval: this.autoSaveInterval,
          locale: this.locale
        }))
      } catch (error) {
        console.error('Failed to save UI settings to localStorage:', error)
      }
    },

    loadFromLocalStorage(): boolean {
      try {
        const data = localStorage.getItem(STORAGE_KEY)
        if (data) {
          const parsed = JSON.parse(data)
          this.splitRatio = parsed.splitRatio || 0.4
          this.autoSaveEnabled = parsed.autoSaveEnabled !== undefined ? parsed.autoSaveEnabled : true
          this.autoSaveInterval = parsed.autoSaveInterval || 30000
          this.locale = parsed.locale || getCurrentLocale()
          return true
        }
      } catch (error) {
        console.error('Failed to load UI settings from localStorage:', error)
      }
      return false
    }
  }
})
