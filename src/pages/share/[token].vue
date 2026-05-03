<template>
  <div class="share-page">
    <div v-if="loading" class="share-loading">
      <span class="loading-spinner-lg"></span>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="share-error">
      <div class="error-icon">😕</div>
      <h2>{{ error }}</h2>
      <p>该分享链接可能已失效或被撤销</p>
    </div>

    <div v-else-if="requiresPassword" class="share-password">
      <div class="password-card">
        <div class="password-icon">🔒</div>
        <h2>需要密码访问</h2>
        <p>该分享链接需要密码才能查看</p>
        <form @submit.prevent="verifyPassword">
          <div class="form-group">
            <input
              v-model="password"
              type="password"
              class="form-input"
              placeholder="输入访问密码"
              required
            />
          </div>
          <div v-if="passwordError" class="password-error">密码错误</div>
          <button type="submit" class="btn-primary">验证</button>
        </form>
      </div>
    </div>

    <div v-else class="share-content">
      <header class="share-header">
        <div class="share-header-inner">
          <div class="share-brand">
            <span class="brand-icon">◈</span>
            <span class="brand-text">PLAN-Tools</span>
          </div>
          <span class="share-badge">只读模式</span>
        </div>
      </header>

      <div class="share-body">
        <div class="share-project-info">
          <h1 class="share-project-name">{{ shareData.project.name }}</h1>
          <p v-if="shareData.project.description" class="share-project-desc">
            {{ shareData.project.description }}
          </p>
          <div class="share-project-meta">
            <span v-if="shareData.project.startDate">
              <i class="fa fa-calendar"></i> {{ shareData.project.startDate }}
            </span>
            <span v-if="shareData.project.endDate">
              <i class="fa fa-flag-checkered"></i> {{ shareData.project.endDate }}
            </span>
          </div>
        </div>

        <div class="share-tabs">
          <button
            class="share-tab"
            :class="{ active: activeTab === 'gantt' }"
            @click="activeTab = 'gantt'"
          >
            <i class="fa fa-bar-chart"></i> 甘特图
          </button>
          <button
            class="share-tab"
            :class="{ active: activeTab === 'list' }"
            @click="activeTab = 'list'"
          >
            <i class="fa fa-list"></i> 任务列表
          </button>
        </div>

        <div v-if="activeTab === 'gantt'" class="share-gantt">
          <ClientOnly>
            <ShareGanttChart :tasks="shareData.tasks" />
          </ClientOnly>
        </div>

        <div v-if="activeTab === 'list'" class="share-list">
          <ShareTaskList :tasks="shareData.tasks" :members="shareData.members" />
        </div>
      </div>

      <footer class="share-footer">
        由 <strong>PLAN-Tools</strong> 创建 · 只读分享
      </footer>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'blank' })

const route = useRoute()
const token = computed(() => route.params.token)

const loading = ref(true)
const error = ref(null)
const requiresPassword = ref(false)
const password = ref('')
const passwordError = ref(false)
const activeTab = ref('gantt')
const shareData = ref({
  project: {},
  tasks: [],
  members: [],
})

async function fetchShareData() {
  loading.value = true
  error.value = null
  try {
    const res = await $fetch(`/api/share/${token.value}`)
    if (res.requiresPassword) {
      requiresPassword.value = true
      loading.value = false
      return
    }
    shareData.value = res
  } catch (e) {
    error.value = e.data?.statusMessage || '加载失败'
  } finally {
    loading.value = false
  }
}

async function verifyPassword() {
  passwordError.value = false
  try {
    const res = await $fetch(`/api/share/${token.value}`, {
      method: 'POST',
      body: { password: password.value },
    })
    if (res.requiresPassword) {
      passwordError.value = true
      return
    }
    requiresPassword.value = false
    shareData.value = res
  } catch (e) {
    passwordError.value = true
  }
}

onMounted(() => {
  fetchShareData()
})
</script>

<style scoped>
.share-page {
  min-height: 100vh;
  background: #f8f9fb;
}

.share-loading, .share-error, .share-password {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
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

.error-icon, .password-icon { font-size: 3rem; }
.share-error h2, .share-password h2 { color: #1a1a2e; margin: 0; }
.share-error p { color: #64748b; margin: 0; }

.password-card {
  background: #fff;
  border-radius: 16px;
  padding: 2.5rem;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  max-width: 360px;
  width: 100%;
}

.password-card p { color: #64748b; font-size: 0.875rem; }

.form-group { margin: 1rem 0; }

.form-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus { border-color: #4285F4; }

.password-error { color: #dc2626; font-size: 0.8125rem; margin-bottom: 0.5rem; }

.btn-primary {
  width: 100%;
  padding: 0.625rem;
  background: #4285F4;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary:hover { background: #3b78db; }

.share-header {
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.share-header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.75rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.share-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand-icon { font-size: 1.25rem; color: #4285F4; }
.brand-text { font-size: 1rem; font-weight: 700; color: #1a1a2e; }

.share-badge {
  background: #fef3c7;
  color: #92400e;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.share-body {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.share-project-info { margin-bottom: 2rem; }

.share-project-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 0.5rem;
}

.share-project-desc {
  color: #64748b;
  font-size: 0.9375rem;
  margin: 0 0 1rem;
}

.share-project-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.8125rem;
  color: #94a3b8;
}

.share-project-meta span {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.share-tabs {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
  background: #fff;
  border-radius: 10px;
  padding: 0.25rem;
  border: 1px solid rgba(0, 0, 0, 0.06);
  width: fit-content;
}

.share-tab {
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  border-radius: 8px;
  font-size: 0.8125rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.share-tab:hover { color: #1a1a2e; background: #f1f5f9; }
.share-tab.active { color: #4285F4; background: rgba(66, 133, 244, 0.08); font-weight: 500; }

.share-gantt {
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  height: 500px;
  overflow: hidden;
}

.share-list {
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.share-footer {
  text-align: center;
  padding: 2rem;
  color: #94a3b8;
  font-size: 0.8125rem;
}
</style>
