<template>
  <div v-if="showMigration" class="migration-overlay">
    <div class="migration-card">
      <div class="migration-icon">📦</div>
      <h2 class="migration-title">发现本地数据</h2>
      <p class="migration-desc">
        检测到您有本地保存的项目数据（{{ localProjectName }}），
        是否将其迁移到云端？
      </p>

      <div class="migration-options">
        <button class="migration-btn migration-btn-primary" :disabled="migrating" @click="handleMigrate">
          <span v-if="migrating" class="btn-spinner"></span>
          <span v-else>迁移到云端</span>
        </button>
        <button class="migration-btn migration-btn-secondary" :disabled="migrating" @click="handleSkip">
          暂不迁移
        </button>
      </div>

      <div v-if="migrationResult" class="migration-result" :class="migrationResult.success ? 'success' : 'error'">
        {{ migrationResult.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/store/auth'
import { useProjectStore } from '~/store/project'
import { useTasksStore } from '~/store/tasks'

const authStore = useAuthStore()
const projectStore = useProjectStore()
const tasksStore = useTasksStore()
const router = useRouter()

const showMigration = ref(false)
const migrating = ref(false)
const migrationResult = ref(null)
const localProjectName = ref('')

onMounted(() => {
  if (!authStore.isAuthenticated) return

  const hasLocalProject = localStorage.getItem('plan-tools-project')
  const hasLocalTasks = localStorage.getItem('plan-tools-tasks')
  const alreadyMigrated = localStorage.getItem('plan-tools-migrated')

  if ((hasLocalProject || hasLocalTasks) && !alreadyMigrated) {
    try {
      const projectData = JSON.parse(hasLocalProject || '{}')
      localProjectName.value = projectData.name || '未命名项目'
      showMigration.value = true
    } catch {
      showMigration.value = false
    }
  }
})

async function handleMigrate() {
  migrating.value = true
  migrationResult.value = null

  try {
    const projectData = JSON.parse(localStorage.getItem('plan-tools-project') || '{}')
    const tasksData = JSON.parse(localStorage.getItem('plan-tools-tasks') || '{}')

    const result = await $fetch('/api/migrate/local', {
      method: 'POST',
      headers: authStore.getAuthHeaders(),
      body: {
        project: projectData,
        tasks: tasksData.tasks || [],
        displaySettings: tasksData.displaySettings,
        colorScheme: tasksData.colorScheme,
      }
    })

    migrationResult.value = { success: true, message: '迁移成功！正在跳转...' }
    localStorage.setItem('plan-tools-migrated', 'true')

    setTimeout(() => {
      showMigration.value = false
      router.push('/projects')
    }, 1500)
  } catch (e) {
    migrationResult.value = { success: false, message: '迁移失败：' + (e.data?.statusMessage || e.message) }
  } finally {
    migrating.value = false
  }
}

function handleSkip() {
  localStorage.setItem('plan-tools-migrated', 'true')
  showMigration.value = false
}
</script>

<style scoped>
.migration-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 2rem;
}

.migration-card {
  background: #fff;
  border-radius: 16px;
  padding: 2.5rem;
  max-width: 420px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.migration-icon { font-size: 3rem; margin-bottom: 1rem; }

.migration-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 0.75rem;
}

.migration-desc {
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.6;
  margin: 0 0 1.5rem;
}

.migration-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.migration-btn {
  padding: 0.625rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.migration-btn-primary {
  background: #4285F4;
  color: #fff;
  border: none;
}

.migration-btn-primary:hover:not(:disabled) { background: #3b78db; }
.migration-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.migration-btn-secondary {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.migration-btn-secondary:hover:not(:disabled) { background: #e2e8f0; }

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.migration-result {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.8125rem;
}

.migration-result.success {
  background: #dcfce7;
  color: #16a34a;
}

.migration-result.error {
  background: #fef2f2;
  color: #dc2626;
}
</style>
