import { defineStore } from 'pinia'

const STORAGE_KEY = 'plan-tools-ui'
const LOCALE_STORAGE_KEY = 'plan-tools-locale'
const I18N_COOKIE_KEY = 'i18n_locale'

const availableLocales = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' }
]

function getCurrentLocale() {
  try {
    const cookieMatch = document.cookie.match(new RegExp('(?:^|;\\s*)' + I18N_COOKIE_KEY + '=([^;]*)'))
    if (cookieMatch) {
      const val = decodeURIComponent(cookieMatch[1])
      if (val === 'en' || val === 'zh-CN') return val
    }
  } catch (error) {
    // ignore
  }
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (saved && (saved === 'en' || saved === 'zh-CN')) {
      return saved
    }
  } catch (error) {
    // ignore
  }
  return 'zh-CN'
}

function setLocale(locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch (error) {
    // ignore
  }
}

export const useUIStore = defineStore('ui', {
  state: () => ({
    splitRatio: 0.4,
    isSplitPaneDragging: false,
    autoSaveEnabled: true,
    autoSaveInterval: 30000, // 30 seconds
    locale: getCurrentLocale()
  }),

  getters: {
    leftPaneWidth: (state) => `${state.splitRatio * 100}%`,
    rightPaneWidth: (state) => `${(1 - state.splitRatio) * 100}%`,
    currentLocale: (state) => state.locale,
    availableLocales: () => availableLocales
  },

  actions: {
    setSplitRatio(ratio) {
      // Constrain ratio between 0.2 and 0.8
      this.splitRatio = Math.max(0.2, Math.min(0.8, ratio))
      this.saveToLocalStorage()
    },

    setLocale(locale) {
      this.locale = locale
      setLocale(locale)
      this.saveToLocalStorage()
    },

    startDragging() {
      this.isSplitPaneDragging = true
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },

    stopDragging() {
      this.isSplitPaneDragging = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    },

    saveToLocalStorage() {
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

    loadFromLocalStorage() {
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
