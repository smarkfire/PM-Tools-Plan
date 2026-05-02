<template>
  <el-dropdown @command="handleLanguageChange" trigger="click">
    <el-button class="language-button" text>
      <span class="flag">{{ currentLocale.flag }}</span>
      <span class="name">{{ currentLocale.name }}</span>
      <i class="fa fa-chevron-down ml-1"></i>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="loc in localeOptions"
          :key="loc.code"
          :command="loc.code"
          :class="{ 'is-active': loc.code === locale }"
        >
          <span class="flag">{{ loc.flag }}</span>
          <span class="name">{{ loc.name }}</span>
          <i v-if="loc.code === locale" class="fa fa-check ml-2"></i>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale, setLocale } = useI18n()

const localeOptions = [
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
]

const currentLocale = computed(() => {
  return localeOptions.find(l => l.code === locale.value) || localeOptions[0]
})

const handleLanguageChange = (newLocale) => {
  if (newLocale !== locale.value) {
    setLocale(newLocale)
    try {
      localStorage.setItem('plan-tools-locale', newLocale)
    } catch (e) {
      // ignore
    }
  }
}
</script>

<style scoped>
.language-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.language-button:hover {
  background: var(--el-bg-color-page);
}

.flag {
  font-size: 1.2rem;
}

.name {
  font-size: 0.875rem;
}

.ml-1 {
  margin-left: 0.25rem;
}

.ml-2 {
  margin-left: 0.5rem;
}

:deep(.is-active) {
  color: var(--el-color-primary);
  font-weight: 500;
}
</style>
