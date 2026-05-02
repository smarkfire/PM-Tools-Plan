<template>
  <div class="skeleton-loader">
    <div v-for="i in rows" :key="i" class="skeleton-row" :style="rowStyle">
      <div
        v-for="j in columns"
        :key="j"
        class="skeleton-cell"
        :style="{ width: getWidth(j), height: rowHeight + 'px' }"
      >
        <div class="skeleton-bar" :style="{ width: getRandomWidth() }"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  rows?: number
  columns?: number
  rowHeight?: number
  minWidth?: number
  maxWidth?: number
}>(), {
  rows: 5,
  columns: 4,
  rowHeight: 40,
  minWidth: 60,
  maxWidth: 100
})

const rowStyle = computed(() => ({
  height: props.rowHeight + 'px'
}))

const getWidth = (col: number) => {
  return `${100 / props.columns}%`
}

const getRandomWidth = () => {
  const min = props.minWidth
  const max = props.maxWidth
  return `${Math.floor(Math.random() * (max - min) + min)}%`
}
</script>

<style scoped>
.skeleton-loader {
  width: 100%;
  padding: 12px;
}

.skeleton-row {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.skeleton-cell {
  display: flex;
  align-items: center;
}

.skeleton-bar {
  height: 14px;
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    var(--el-fill-color) 25%,
    var(--el-fill-color-light) 37%,
    var(--el-fill-color) 63%
  );
  background-size: 400% 100%;
  animation: skeleton-loading 1.4s ease infinite;
}

@keyframes skeleton-loading {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}
</style>
