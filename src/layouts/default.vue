<template>
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
          <NuxtLink to="/workspace" class="nav-link" :class="{ active: isWorkspace }">
            {{ $t('landing.nav.workspace') }}
          </NuxtLink>
        </nav>

        <div class="navbar-actions">
          <LanguageSwitcher />
        </div>
      </div>
    </header>

    <main class="app-main">
      <slot />
    </main>
  </div>
</template>

<script setup>
import LanguageSwitcher from '~/components/common/LanguageSwitcher.vue'

const route = useRoute()
const isHome = computed(() => route.path === '/')
const isWorkspace = computed(() => route.path === '/workspace')
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

.app-main {
  flex: 1;
}
</style>
