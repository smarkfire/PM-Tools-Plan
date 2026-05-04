import { useAuthStore } from '~/store/auth'

export default defineNuxtPlugin(async (nuxtApp) => {
  const authStore = useAuthStore()

  await authStore.initAuth()

  addRouteMiddleware('auth', (to) => {
    const publicRoutes = ['/', '/login', '/register']
    const shareRoute = to.path.startsWith('/share/')
    const localeRoute = /^\/(zh-CN|en)(\/|$)/.test(to.path)
    const isPublicRoute = publicRoutes.includes(to.path) || localeRoute

    if (shareRoute) return

    if (!authStore.isAuthenticated && !isPublicRoute) {
      return navigateTo('/login')
    }

    if (authStore.isAuthenticated && (to.path === '/login' || to.path === '/register')) {
      return navigateTo('/projects')
    }
  }, { global: true })
})
