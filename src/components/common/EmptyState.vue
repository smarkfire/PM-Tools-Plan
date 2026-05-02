<template>
  <div class="empty-state">
    <div class="empty-icon">
      <i :class="icon" :style="{ fontSize: iconSize + 'px' }"></i>
    </div>
    <h3 v-if="title" class="empty-title">{{ title }}</h3>
    <p v-if="description" class="empty-description">{{ description }}</p>
    <slot name="action"></slot>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  icon?: string
  iconSize?: number
  title?: string
  description?: string
}>(), {
  icon: 'fa fa-inbox',
  iconSize: 48,
  title: '',
  description: ''
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: var(--el-text-color-secondary);
}

.empty-icon {
  margin-bottom: 16px;
  opacity: 0.4;
}

.empty-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  margin: 0 0 8px;
}

.empty-description {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0;
  text-align: center;
  max-width: 400px;
  line-height: 1.6;
}
</style>
