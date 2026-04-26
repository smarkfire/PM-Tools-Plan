<template>
  <el-config-provider :locale="elementLocale">
    <div id="app" class="min-h-screen bg-bg-base">
      <el-container>
        <!-- Header -->
        <el-header class="bg-white shadow-sm border-b">
          <div class="h-full flex items-center justify-between px-6">
            <div class="flex items-center gap-4">
              <h1 class="text-xl font-bold text-primary">
                <i class="fa fa-project-diagram mr-2"></i>
                {{ $t('app.title') }}
              </h1>
              <span class="text-text-secondary text-sm">{{ $t('app.subtitle') }}</span>
            </div>
            <div class="flex items-center gap-4">
              <nav class="flex gap-2">
                <router-link
                  to="/project-info"
                  class="px-4 py-2 rounded transition-colors"
                  :class="$route.path === '/project-info' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-100'"
                >
                  <i class="fa fa-info-circle mr-1"></i>
                  {{ $t('app.nav.projectInfo') }}
                </router-link>
                <router-link
                  to="/project-plan"
                  class="px-4 py-2 rounded transition-colors"
                  :class="$route.path === '/project-plan' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-100'"
                >
                  <i class="fa fa-tasks mr-1"></i>
                  {{ $t('app.nav.projectPlan') }}
                </router-link>
              </nav>
              <LanguageSwitcher />
            </div>
          </div>
        </el-header>

        <!-- Main Content -->
        <el-main class="p-6">
          <router-view />
        </el-main>

        <!-- Footer -->
        <el-footer class="bg-white border-t text-center text-text-secondary text-sm py-4">
          {{ $t('app.footer') }}
        </el-footer>
      </el-container>
    </div>
  </el-config-provider>
</template>

<script setup>
import { onMounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ElementPlusLocaleEn from 'element-plus/es/locale/lang/en'
import ElementPlusLocaleZhCn from 'element-plus/es/locale/lang/zh-cn'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'

const { t, locale } = useI18n()

const elementLocale = computed(() => {
  return locale.value === 'zh-CN' ? ElementPlusLocaleZhCn : ElementPlusLocaleEn
})

const updateTitle = () => {
  document.title = `${t('app.title')} - ${t('app.subtitle')}`
}

onMounted(() => {
  updateTitle()
})

watch(locale, () => {
  updateTitle()
})
</script>
