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
          v-for="locale in availableLocales"
          :key="locale.code"
          :command="locale.code"
          :class="{ 'is-active': locale.code === uiStore.locale }"
        >
          <span class="flag">{{ locale.flag }}</span>
          <span class="name">{{ locale.name }}</span>
          <i v-if="locale.code === uiStore.locale" class="fa fa-check ml-2"></i>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { computed } from 'vue'
import { useUIStore } from '@/store/ui'

const uiStore = useUIStore()

const currentLocale = computed(() => {
  return uiStore.availableLocales.find(l => l.code === uiStore.locale) || uiStore.availableLocales[0]
})

const availableLocales = computed(() => uiStore.availableLocales)

const handleLanguageChange = (locale) => {
  if (locale !== uiStore.locale) {
    uiStore.setLocale(locale)
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
