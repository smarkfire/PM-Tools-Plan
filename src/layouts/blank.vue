<template>
  <el-config-provider :locale="epLocale">
    <div class="blank-layout">
      <div class="blank-lang-switcher">
        <LanguageSwitcher />
      </div>
      <slot />
    </div>
  </el-config-provider>
</template>

<script setup>
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import LanguageSwitcher from '~/components/common/LanguageSwitcher.vue'

const { locale } = useI18n()
const epLocale = computed(() => locale.value === 'zh-CN' ? zhCn : en)
</script>

<style scoped>
.blank-layout {
  min-height: 100vh;
  position: relative;
}

.blank-lang-switcher {
  position: fixed;
  top: 1rem;
  right: 1.5rem;
  z-index: 100;
}
</style>
