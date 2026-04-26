import { createI18n } from 'vue-i18n'
import en from './en.json'
import zhCN from './zh-CN.json'

const DEFAULT_LOCALE = 'en'
const STORAGE_KEY = 'plan-tools-locale'

// Get saved locale or use default
const getInitialLocale = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && (saved === 'en' || saved === 'zh-CN')) {
      return saved
    }
  } catch (error) {
    console.warn('Failed to read locale from localStorage:', error)
  }
  return DEFAULT_LOCALE
}

const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: getInitialLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: {
    en,
    'zh-CN': zhCN
  },
  globalInjection: true // Allow global $t access
})

export default i18n

// Export helper functions
export const setLocale = (locale) => {
  i18n.global.locale.value = locale
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch (error) {
    console.warn('Failed to save locale to localStorage:', error)
  }
}

export const getCurrentLocale = () => {
  return i18n.global.locale.value
}

export const availableLocales = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' }
]
