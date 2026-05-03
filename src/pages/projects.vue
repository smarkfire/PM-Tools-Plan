<template>
  <div class="projects-page">
    <div class="projects-header">
      <div class="projects-header-inner">
        <div class="projects-title-group">
          <h1 class="projects-title">{{ $t('projects.title') }}</h1>
          <span class="projects-subtitle">{{ $t('projects.subtitle', { count: projects.length }) }}</span>
        </div>
        <div class="projects-header-actions">
          <button class="btn-primary" @click="showCreateDialog = true">
            <i class="fa fa-plus"></i>
            {{ $t('projects.create') }}
          </button>
        </div>
      </div>
    </div>

    <div class="projects-body">
      <div v-if="loading" class="projects-loading">
        <span class="loading-spinner-lg"></span>
        <p>{{ $t('projects.loading') }}</p>
      </div>

      <div v-else-if="projects.length === 0" class="projects-empty">
        <div class="empty-icon">📋</div>
        <h2>{{ $t('projects.emptyTitle') }}</h2>
        <p>{{ $t('projects.emptyDesc') }}</p>
        <button class="btn-primary" @click="showCreateDialog = true">
          <i class="fa fa-plus"></i>
          {{ $t('projects.create') }}
        </button>
      </div>

      <div v-else class="projects-grid">
        <div
          v-for="project in projects"
          :key="project.id"
          class="project-card"
          @click="openProject(project.id)"
        >
          <div class="project-card-header">
            <h3 class="project-card-name">{{ project.name }}</h3>
            <button class="project-card-menu" @click.stop="toggleMenu(project.id)">
              <i class="fa fa-ellipsis-v"></i>
            </button>
          </div>
          <p class="project-card-desc">{{ project.description || $t('projects.noDescription') }}</p>
          <div class="project-card-meta">
            <span v-if="project.startDate" class="meta-item">
              <i class="fa fa-calendar"></i>
              {{ project.startDate }}
            </span>
            <span class="meta-item">
              <i class="fa fa-clock"></i>
              {{ formatDate(project.updatedAt) }}
            </span>
          </div>
          <div v-if="activeMenu === project.id" :ref="el => { if (el) activeMenuRefs[project.id] = el }" class="project-card-dropdown" @click.stop>
            <button @click="openProject(project.id)">{{ $t('projects.open') }}</button>
            <button @click="confirmDelete(project)">{{ $t('projects.delete') }}</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCreateDialog" class="dialog-overlay" @click.self="showCreateDialog = false">
      <div class="dialog-card">
        <h2 class="dialog-title">{{ $t('projects.createTitle') }}</h2>
        <form @submit.prevent="createProject">
          <div class="form-group">
            <label class="form-label">{{ $t('projects.projectName') }}</label>
            <input v-model="newProject.name" class="form-input" :placeholder="$t('projects.projectNamePlaceholder')" required />
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('projects.projectDescription') }}</label>
            <textarea v-model="newProject.description" class="form-textarea" :placeholder="$t('projects.projectDescriptionPlaceholder')" rows="3"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">{{ $t('projects.startDate') }}</label>
              <input v-model="newProject.startDate" type="date" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">{{ $t('projects.endDate') }}</label>
              <input v-model="newProject.endDate" type="date" class="form-input" />
            </div>
          </div>
          <div class="dialog-actions">
            <button type="button" class="btn-secondary" @click="showCreateDialog = false">{{ $t('projects.cancel') }}</button>
            <button type="submit" class="btn-primary" :disabled="creating">
              {{ creating ? $t('projects.creating') : $t('projects.createBtn') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="deleteTarget" class="dialog-overlay" @click.self="deleteTarget = null">
      <div class="dialog-card dialog-sm">
        <h2 class="dialog-title">{{ $t('projects.deleteTitle') }}</h2>
        <p>{{ $t('projects.deleteConfirm', { name: deleteTarget.name }) }}</p>
        <div class="dialog-actions">
          <button class="btn-secondary" @click="deleteTarget = null">{{ $t('projects.cancel') }}</button>
          <button class="btn-danger" :disabled="deleting" @click="deleteProject">
            {{ deleting ? $t('projects.deleting') : $t('projects.deleteBtn') }}
          </button>
        </div>
      </div>
    </div>
    <DataMigrationDialog />
  </div>
</template>

<script setup>
import { useAuthStore } from '~/store/auth'
import DataMigrationDialog from '~/components/Migration/DataMigrationDialog.vue'

const authStore = useAuthStore()
const router = useRouter()

const projects = ref([])
const loading = ref(true)
const creating = ref(false)
const deleting = ref(false)
const showCreateDialog = ref(false)
const activeMenu = ref(null)
const activeMenuRefs = ref({})

function handleClickOutside(e) {
  if (activeMenu.value) {
    const el = activeMenuRefs.value[activeMenu.value]
    if (el && !el.contains(e.target)) {
      activeMenu.value = null
    }
  }
}

onMounted(() => {
  fetchProjects()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
const deleteTarget = ref(null)

const newProject = reactive({
  name: '',
  description: '',
  startDate: '',
  endDate: '',
})

async function fetchProjects() {
  loading.value = true
  try {
    projects.value = await $fetch('/api/projects', {
      headers: authStore.getAuthHeaders(),
    })
  } catch (e) {
    console.error('Failed to fetch projects:', e)
  } finally {
    loading.value = false
  }
}

async function createProject() {
  creating.value = true
  try {
    await $fetch('/api/projects', {
      method: 'POST',
      headers: authStore.getAuthHeaders(),
      body: newProject,
    })
    showCreateDialog.value = false
    Object.assign(newProject, { name: '', description: '', startDate: '', endDate: '' })
    await fetchProjects()
  } catch (e) {
    console.error('Failed to create project:', e)
  } finally {
    creating.value = false
  }
}

async function deleteProject() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await $fetch(`/api/projects/${deleteTarget.value.id}`, {
      method: 'DELETE',
      headers: authStore.getAuthHeaders(),
    })
    deleteTarget.value = null
    await fetchProjects()
  } catch (e) {
    console.error('Failed to delete project:', e)
  } finally {
    deleting.value = false
  }
}

function openProject(id) {
  router.push(`/workspace?id=${id}`)
}

function toggleMenu(id) {
  activeMenu.value = activeMenu.value === id ? null : id
}

function confirmDelete(project) {
  activeMenu.value = null
  deleteTarget.value = project
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.projects-page {
  min-height: 100vh;
  background: #f8f9fb;
}

.projects-header {
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.projects-header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.projects-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.projects-subtitle {
  color: #64748b;
  font-size: 0.875rem;
  margin-left: 0.75rem;
}

.projects-header-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: #4285F4;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) { background: #3b78db; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-secondary {
  padding: 0.5rem 1.25rem;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover { background: #e2e8f0; }

.btn-danger {
  padding: 0.5rem 1.25rem;
  background: #dc2626;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-danger:hover:not(:disabled) { background: #b91c1c; }
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

.projects-body {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.projects-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem;
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

.projects-empty {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon { font-size: 3rem; margin-bottom: 1rem; }
.projects-empty h2 { color: #1a1a2e; margin: 0 0 0.5rem; }
.projects-empty p { color: #64748b; margin: 0 0 1.5rem; }

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
}

.project-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem;
  border: 1px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.project-card:hover {
  border-color: rgba(66, 133, 244, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.project-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.project-card-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
  flex: 1;
}

.project-card-menu {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
}

.project-card-menu:hover { color: #475569; background: #f1f5f9; }

.project-card-desc {
  color: #64748b;
  font-size: 0.8125rem;
  margin: 0 0 1rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-card-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #94a3b8;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.project-card-dropdown {
  position: absolute;
  top: 2.5rem;
  right: 0.75rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  overflow: hidden;
  min-width: 120px;
}

.project-card-dropdown button {
  display: block;
  width: 100%;
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  text-align: left;
  font-size: 0.8125rem;
  color: #374151;
  cursor: pointer;
}

.project-card-dropdown button:hover { background: #f1f5f9; }
.project-card-dropdown button:last-child { color: #dc2626; }

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 2rem;
}

.dialog-card {
  background: #fff;
  border-radius: 16px;
  padding: 2rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.dialog-sm { max-width: 380px; }

.dialog-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-input, .form-textarea {
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1a1a2e;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus, .form-textarea:focus {
  border-color: #4285F4;
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.15);
}

.form-textarea { resize: vertical; }

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
</style>
