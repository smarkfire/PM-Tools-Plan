export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: {
    'zh-Hans': ['zh-CN'],
    'zh': ['zh-CN'],
    'default': ['en']
  },
  missingWarn: false,
  fallbackWarn: false
}))
