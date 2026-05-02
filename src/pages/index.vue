<template>
  <div class="home-container">
    <h1 class="text-4xl font-bold mb-4">PLAN-Tools</h1>
    <p class="text-xl mb-8">{{ $t('app.subtitle') }}</p>
    <div class="actions">
      <el-button type="primary" size="large" @click="navigateTo('/project-info')">
        <i class="fa fa-info-circle mr-2"></i>
        {{ $t('app.nav.projectInfo') }}
      </el-button>
      <el-button size="large" @click="navigateTo('/project-plan')">
        <i class="fa fa-tasks mr-2"></i>
        {{ $t('app.nav.projectPlan') }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
})
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: #333;
}

.actions {
  display: flex;
  gap: 1rem;
}
</style>
