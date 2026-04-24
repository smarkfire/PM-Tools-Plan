<template>
  <div id="app" class="min-h-screen bg-bg-base">
    <el-container>
      <!-- Header -->
      <el-header class="bg-white shadow-sm border-b">
        <div class="h-full flex items-center justify-between px-6">
          <div class="flex items-center gap-4">
            <h1 class="text-xl font-bold text-primary">
              <i class="fa fa-project-diagram mr-2"></i>
              PLAN-Tools
            </h1>
            <span class="text-text-secondary text-sm">项目计划管理软件</span>
          </div>
          <nav class="flex gap-2">
            <router-link
              to="/project-info"
              class="px-4 py-2 rounded transition-colors"
              :class="$route.path === '/project-info' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-100'"
            >
              <i class="fa fa-info-circle mr-1"></i>
              项目信息管理
            </router-link>
            <router-link
              to="/project-plan"
              class="px-4 py-2 rounded transition-colors"
              :class="$route.path === '/project-plan' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-100'"
            >
              <i class="fa fa-tasks mr-1"></i>
              项目计划管理
            </router-link>
          </nav>
        </div>
      </el-header>

      <!-- Main Content -->
      <el-main class="p-6">
        <router-view />
      </el-main>

      <!-- Footer -->
      <el-footer class="bg-white border-t text-center text-text-secondary text-sm py-4">
        PLAN-Tools - 项目计划管理软件 © 2026
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  document.title = 'PLAN-Tools - 项目计划管理软件'
})
</script>
