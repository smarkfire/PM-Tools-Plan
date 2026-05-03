<template>
  <div class="workspace-page">
    <div v-if="loading" class="workspace-loading">
      <span class="loading-spinner-lg"></span>
      <p>加载项目...</p>
    </div>
    <div v-else-if="loadError" class="workspace-error">
      <p>{{ loadError }}</p>
      <NuxtLink to="/projects" class="btn-back">返回项目列表</NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/store/auth'
import { useProjectStore } from '~/store/project'
import { useTasksStore } from '~/store/tasks'
import { useUIStore } from '~/store/ui'

const route = useRoute()
const projectId = computed(() => route.params.id)

const projectStore = useProjectStore()
const tasksStore = useTasksStore()
const uiStore = useUIStore()
const authStore = useAuthStore()

const loading = ref(true)
const loadError = ref(null)

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    loadError.value = '请先登录'
    loading.value = false
    return
  }

  projectStore.setApiMode(true)
  tasksStore.setApiMode(true)

  const projectLoaded = await projectStore.loadProject(projectId.value)
  const tasksLoaded = await tasksStore.loadTasks(projectId.value)

  if (!projectLoaded) {
    loadError.value = '项目不存在或无权访问'
    loading.value = false
    return
  }

  uiStore.loadFromLocalStorage()
  loading.value = false

  navigateTo('/workspace', { replace: true })
})
</script>

<style scoped>
.workspace-loading, .workspace-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1rem;
  color: #64748b;
}

.loading-spinner-lg {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #4285F4;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.btn-back {
  padding: 0.5rem 1.25rem;
  background: #4285F4;
  color: #fff;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.875rem;
}

.btn-back:hover { background: #3b78db; }
</style>
