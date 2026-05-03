import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken && !!state.user,
    userEmail: (state) => state.user?.email || '',
    displayName: (state) => state.user?.displayName || '',
  },

  actions: {
    async register({ email, password, displayName }) {
      this.loading = true
      this.error = null
      try {
        const res = await $fetch('/api/auth/register', {
          method: 'POST',
          body: { email, password, displayName },
        })
        this.accessToken = res.accessToken
        this.user = res.user
        return true
      } catch (e) {
        this.error = e.data?.statusMessage || e.message || 'Registration failed'
        return false
      } finally {
        this.loading = false
      }
    },

    async login({ email, password }) {
      this.loading = true
      this.error = null
      try {
        const res = await $fetch('/api/auth/login', {
          method: 'POST',
          body: { email, password },
        })
        this.accessToken = res.accessToken
        this.user = res.user
        return true
      } catch (e) {
        this.error = e.data?.statusMessage || e.message || 'Login failed'
        return false
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        await $fetch('/api/auth/logout', { method: 'POST' })
      } catch {}
      this.accessToken = null
      this.user = null
    },

    async fetchUser() {
      if (!this.accessToken) return
      try {
        const res = await $fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        })
        this.user = res
      } catch {
        await this.refreshToken()
      }
    },

    async refreshToken() {
      try {
        const res = await $fetch('/api/auth/refresh', { method: 'POST' })
        this.accessToken = res.accessToken
        await this.fetchUser()
      } catch {
        this.accessToken = null
        this.user = null
      }
    },

    async initAuth() {
      if (this.accessToken) {
        await this.fetchUser()
      } else {
        await this.refreshToken()
      }
    },

    getAuthHeaders() {
      if (!this.accessToken) return {}
      return { Authorization: `Bearer ${this.accessToken}` }
    },
  },
})
