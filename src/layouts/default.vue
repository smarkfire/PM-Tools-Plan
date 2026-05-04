<template>
  <el-config-provider :locale="epLocale">
    <div class="app-layout">
    <header class="app-navbar">
      <div class="navbar-inner">
        <NuxtLink to="/" class="navbar-brand">
          <span class="brand-icon">◈</span>
          <span class="brand-text">PLAN-Tools</span>
        </NuxtLink>

        <nav class="navbar-nav">
          <NuxtLink to="/" class="nav-link" :class="{ active: isHome }">
            {{ $t('landing.nav.home') }}
          </NuxtLink>
          <ClientOnly>
            <NuxtLink v-if="authStore.isAuthenticated" to="/projects" class="nav-link" :class="{ active: isProjects }">
              {{ $t('landing.nav.myProjects') }}
            </NuxtLink>
            <NuxtLink v-if="authStore.isAuthenticated" to="/workspace" class="nav-link" :class="{ active: isWorkspace }">
              {{ $t('landing.nav.workspace') }}
            </NuxtLink>
          </ClientOnly>
        </nav>

        <div class="navbar-actions">
          <LanguageSwitcher />
          <ClientOnly>
            <div v-if="authStore.isAuthenticated" ref="userMenuRef" class="user-menu" @click="showUserMenu = !showUserMenu">
              <div class="user-avatar">{{ authStore.displayName.charAt(0).toUpperCase() }}</div>
              <span class="user-name">{{ authStore.displayName }}</span>
              <i class="fa fa-chevron-down user-arrow"></i>
              <div v-if="showUserMenu" class="user-dropdown">
                <div class="user-dropdown-header">
                  <div class="user-dropdown-email">{{ authStore.userEmail }}</div>
                </div>
                <button class="user-dropdown-item" @click="handleLogout">
                  <i class="fa fa-sign-out"></i> {{ $t('landing.nav.logout') }}
                </button>
              </div>
            </div>
            <NuxtLink v-else to="/login" class="nav-link login-link">
              {{ $t('landing.nav.login') }}
            </NuxtLink>
          </ClientOnly>
        </div>
      </div>
    </header>

    <main class="app-main">
      <slot />
    </main>
  </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import LanguageSwitcher from '~/components/common/LanguageSwitcher.vue'
import { useAuthStore } from '~/store/auth'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'

const { locale } = useI18n()
const epLocale = computed(() => locale.value === 'zh-CN' ? zhCn : en)

const route = useRoute()
const authStore = useAuthStore()

const isHome = computed(() => route.path === '/')
const isProjects = computed(() => route.path === '/projects')
const isWorkspace = computed(() => route.path.startsWith('/workspace'))
const showUserMenu = ref(false)
const userMenuRef = ref(null)

function handleClickOutside(e: MouseEvent) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target as Node)) {
    showUserMenu.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

async function handleLogout() {
  showUserMenu.value = false
  await authStore.logout()
  navigateTo('/login')
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fb;
}

.app-navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.navbar-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
  height: 60px;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  flex-shrink: 0;
}

.brand-icon {
  font-size: 1.5rem;
  color: #4285F4;
}

.brand-text {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: -0.02em;
}

.navbar-nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: 1rem;
}

.nav-link {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  text-decoration: none;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: #1a1a2e;
  background: rgba(0, 0, 0, 0.04);
}

.nav-link.active {
  color: #4285F4;
  background: rgba(66, 133, 244, 0.08);
}

.navbar-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.login-link {
  background: #4285F4;
  color: #fff !important;
  border-radius: 8px;
  padding: 0.375rem 1rem;
}

.login-link:hover {
  background: #3b78db !important;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  position: relative;
  transition: background 0.2s;
}

.user-menu:hover { background: rgba(0, 0, 0, 0.04); }

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #4285F4;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.user-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
}

.user-arrow {
  font-size: 0.625rem;
  color: #94a3b8;
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 180px;
  overflow: hidden;
  z-index: 200;
}

.user-dropdown-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.user-dropdown-email {
  font-size: 0.75rem;
  color: #64748b;
}

.user-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.625rem 1rem;
  background: none;
  border: none;
  font-size: 0.8125rem;
  color: #374151;
  cursor: pointer;
  text-align: left;
}

.user-dropdown-item:hover { background: #f1f5f9; }

.app-main {
  flex: 1;
}
</style>
