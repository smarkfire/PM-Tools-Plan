export default defineNuxtConfig({
  srcDir: 'src/',

  modules: [
    '@pinia/nuxt',
    '@element-plus/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n'
  ],

  css: [
    '~/assets/main.css',
    '@fortawesome/fontawesome-free/css/all.min.css'
  ],

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },

  elementPlus: {
    locale: 'zh-cn'
  },

  i18n: {
    locales: [
      { code: 'zh-CN', name: '中文', files: ['zh-CN.json'] },
      { code: 'en', name: 'English', files: ['en.json'] }
    ],
    defaultLocale: 'zh-CN',
    fallbackLocale: 'en',
    lazy: true,
    bundle: {
      optimizeTranslationDirective: false
    },
    compilation: {
      strictMessage: false
    },
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      redirectOn: 'root'
    },
    vueI18n: 'i18n.config'
  },

  vite: {
    optimizeDeps: {
      include: ['dhtmlx-gantt', 'xlsx', 'sortablejs']
    }
  },

  runtimeConfig: {
    deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
    deepseekApiBase: process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com',
    deepseekModel: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    qwenApiKey: process.env.QWEN_API_KEY || '',
    qwenApiBase: process.env.QWEN_API_BASE || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    qwenModel: process.env.QWEN_MODEL || 'qwen-max'
  },

  compatibilityDate: '2025-05-01'
})
