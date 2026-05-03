<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <NuxtLink to="/" class="auth-brand">
            <span class="brand-icon">◈</span>
            <span class="brand-text">PLAN-Tools</span>
          </NuxtLink>
          <h1 class="auth-title">注册</h1>
          <p class="auth-subtitle">创建你的账户开始使用</p>
        </div>

        <div v-if="authStore.error" class="auth-error">
          <i class="fa fa-exclamation-circle"></i>
          {{ authStore.error }}
        </div>

        <form class="auth-form" @submit.prevent="handleRegister">
          <div class="form-group">
            <label class="form-label">显示名称</label>
            <input
              v-model="form.displayName"
              type="text"
              class="form-input"
              placeholder="你的名字"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input
              v-model="form.email"
              type="email"
              class="form-input"
              placeholder="your@email.com"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">密码</label>
            <input
              v-model="form.password"
              type="password"
              class="form-input"
              placeholder="至少8位"
              required
              minlength="8"
            />
          </div>

          <div class="form-group">
            <label class="form-label">确认密码</label>
            <input
              v-model="form.confirmPassword"
              type="password"
              class="form-input"
              placeholder="再次输入密码"
              required
              minlength="8"
            />
          </div>

          <div v-if="form.confirmPassword && form.password !== form.confirmPassword" class="auth-error">
            两次输入的密码不一致
          </div>

          <button
            type="submit"
            class="auth-btn"
            :disabled="authStore.loading || form.password !== form.confirmPassword"
          >
            <span v-if="authStore.loading" class="loading-spinner"></span>
            <span v-else>注册</span>
          </button>
        </form>

        <div class="auth-footer">
          已有账户？
          <NuxtLink to="/login" class="auth-link">立即登录</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/store/auth'

definePageMeta({ layout: 'blank' })

const authStore = useAuthStore()
const router = useRouter()

const form = reactive({
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
})

async function handleRegister() {
  if (form.password !== form.confirmPassword) return
  const success = await authStore.register({
    email: form.email,
    password: form.password,
    displayName: form.displayName,
  })
  if (success) {
    router.push('/projects')
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push('/projects')
  }
})
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.auth-container {
  width: 100%;
  max-width: 420px;
}

.auth-card {
  background: #fff;
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  margin-bottom: 1.5rem;
}

.brand-icon {
  font-size: 1.5rem;
  color: #4285F4;
}

.brand-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: -0.02em;
}

.auth-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 0.5rem;
}

.auth-subtitle {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0;
}

.auth-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-input {
  height: 44px;
  padding: 0 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9375rem;
  color: #1a1a2e;
  background: #fff;
  transition: all 0.2s;
  outline: none;
}

.form-input:focus {
  border-color: #4285F4;
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.15);
}

.form-input::placeholder {
  color: #9ca3af;
}

.auth-btn {
  height: 44px;
  background: #4285F4;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.5rem;
}

.auth-btn:hover:not(:disabled) {
  background: #3b78db;
}

.auth-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.auth-footer {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.875rem;
  color: #64748b;
}

.auth-link {
  color: #4285F4;
  text-decoration: none;
  font-weight: 500;
}

.auth-link:hover {
  text-decoration: underline;
}
</style>
