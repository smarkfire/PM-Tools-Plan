import { defineStore } from 'pinia'
import type { AuthUser } from '~/types'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  loading: boolean
  error: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.accessToken && !!state.user,
    userEmail: (state): string => state.user?.email || '',
    displayName: (state): string => state.user?.displayName || '',
  },

  actions: {
    async register({ email, password, displayName }: { email: string; password: string; displayName: string }): Promise<boolean> {
      this.loading = true
      this.error = null
      try {
        const res = await $fetch<{ accessToken: string; user: AuthUser }>('/api/auth/register', {
          method: 'POST',
          body: { email, password, displayName },
        })
        this.accessToken = res.accessToken
        this.user = res.user
        if (import.meta.client) localStorage.setItem('auth_token', res.accessToken)
        return true
      } catch (e: unknown) {
        const err = e as { data?: { statusMessage?: string }; message?: string }
        this.error = err.data?.statusMessage || err.message || 'Registration failed'
        return false
      } finally {
        this.loading = false
      }
    },

    async login({ email, password }: { email: string; password: string }): Promise<boolean> {
      this.loading = true
      this.error = null
      try {
        const res = await $fetch<{ accessToken: string; user: AuthUser }>('/api/auth/login', {
          method: 'POST',
          body: { email, password },
        })
        this.accessToken = res.accessToken
        this.user = res.user
        if (import.meta.client) localStorage.setItem('auth_token', res.accessToken)
        return true
      } catch (e: unknown) {
        const err = e as { data?: { statusMessage?: string }; message?: string }
        this.error = err.data?.statusMessage || err.message || 'Login failed'
        return false
      } finally {
        this.loading = false
      }
    },

    async logout(): Promise<void> {
      try {
        await $fetch('/api/auth/logout', { method: 'POST' })
      } catch {}
      this.accessToken = null
      this.user = null
      if (import.meta.client) localStorage.removeItem('auth_token')
    },

    async fetchUser(): Promise<void> {
      if (!this.accessToken) return
      try {
        const res = await $fetch<AuthUser>('/api/auth/me', {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        })
        this.user = res
      } catch {
        await this.refreshToken()
      }
    },

    async refreshToken(): Promise<void> {
      try {
        const res = await $fetch<{ accessToken: string }>('/api/auth/refresh', { method: 'POST' })
        this.accessToken = res.accessToken
        if (import.meta.client) localStorage.setItem('auth_token', res.accessToken)
        await this.fetchUser()
      } catch {
        this.accessToken = null
        this.user = null
        if (import.meta.client) localStorage.removeItem('auth_token')
      }
    },

    async initAuth(): Promise<void> {
      if (this.accessToken) {
        await this.fetchUser()
      } else {
        await this.refreshToken()
      }
    },

    getAuthHeaders(): Record<string, string> {
      if (!this.accessToken) return {}
      return { Authorization: `Bearer ${this.accessToken}` }
    },
  },
})
