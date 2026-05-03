<template>
  <el-config-provider :locale="epLocale">
    <slot />
  </el-config-provider>
</template>

<script setup>
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'

const { locale } = useI18n()
const epLocale = computed(() => locale.value === 'zh-CN' ? zhCn : en)
</script>
