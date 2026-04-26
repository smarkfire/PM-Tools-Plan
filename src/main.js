import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import ElementPlusLocaleEn from 'element-plus/es/locale/lang/en'
import ElementPlusLocaleZhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './assets/main.css'
import './utils/mockHelper.js'

import App from './App.vue'
import router from './router'
import i18n from './locales'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

// Initialize Element Plus with default locale
app.use(ElementPlus, { locale: ElementPlusLocaleEn })

app.mount('#app')
