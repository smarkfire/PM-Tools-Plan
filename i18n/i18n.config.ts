export default defineI18nConfig(() => {
  let initialLocale = 'zh-CN'
  if (import.meta.client) {
    try {
      const cookieMatch = document.cookie.match(/(?:^|;\s*)i18n_locale=([^;]*)/)
      if (cookieMatch) {
        const val = decodeURIComponent(cookieMatch[1])
        if (val === 'en' || val === 'zh-CN') {
          initialLocale = val
        }
      }
    } catch (e) {
      // ignore
    }
  }

  return {
    legacy: false,
    locale: initialLocale,
    fallbackLocale: {
      'zh-Hans': ['zh-CN'],
      'zh': ['zh-CN'],
      'default': ['en']
    },
    missingWarn: false,
    fallbackWarn: false,
    warnHtmlMessage: false
  }
})
