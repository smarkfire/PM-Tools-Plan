import { defineStore } from 'pinia'

const MAX_MESSAGES_PER_SESSION = 100
const MAX_SESSIONS = 10
const STORAGE_KEY = 'plan-tools-chat'

export const useChatStore = defineStore('chat', {
  state: () => ({
    sessions: [] as Array<{
      id: string
      title: string
      messages: Array<{ role: string; content: string; timestamp: string }>
      createdAt: string
      updatedAt: string
    }>,
    currentSessionId: null as string | null,
    isOpen: false
  }),

  getters: {
    currentSession: (state) => {
      if (!state.currentSessionId) return null
      return state.sessions.find(s => s.id === state.currentSessionId)
    },

    currentMessages: (state) => {
      const session = state.sessions.find(s => s.id === state.currentSessionId)
      if (!session) return []
      return session.messages
    }
  },

  actions: {
    generateId() {
      return `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },

    createSession() {
      const session = {
        id: this.generateId(),
        title: '新对话',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      this.sessions.unshift(session)
      this.currentSessionId = session.id
      this.saveToLocalStorage()
      return session
    },

    addMessage(role: string, content: string) {
      if (!this.currentSessionId) {
        this.createSession()
      }
      const session = this.sessions.find(s => s.id === this.currentSessionId)
      if (session) {
        session.messages.push({
          role,
          content,
          timestamp: new Date().toISOString()
        })
        if (session.messages.length > MAX_MESSAGES_PER_SESSION) {
          session.messages = session.messages.slice(-MAX_MESSAGES_PER_SESSION)
        }
        if (role === 'user' && session.messages.filter(m => m.role === 'user').length === 1) {
          session.title = content.substring(0, 20) + (content.length > 20 ? '...' : '')
        }
        session.updatedAt = new Date().toISOString()
        this.saveToLocalStorage()
      }
    },

    updateLastAssistantMessage(content: string) {
      const session = this.sessions.find(s => s.id === this.currentSessionId)
      if (session && session.messages.length > 0) {
        const lastMsg = session.messages[session.messages.length - 1]
        if (lastMsg.role === 'assistant') {
          lastMsg.content = content
        }
      }
    },

    deleteSession(sessionId: string) {
      const index = this.sessions.findIndex(s => s.id === sessionId)
      if (index !== -1) {
        this.sessions.splice(index, 1)
        if (this.currentSessionId === sessionId) {
          this.currentSessionId = this.sessions.length > 0 ? this.sessions[0].id : null
        }
        this.saveToLocalStorage()
      }
    },

    clearHistory() {
      if (this.currentSessionId) {
        const session = this.sessions.find(s => s.id === this.currentSessionId)
        if (session) {
          session.messages = []
          session.title = '新对话'
          session.updatedAt = new Date().toISOString()
          this.saveToLocalStorage()
        }
      }
    },

    setOpen(open: boolean) {
      this.isOpen = open
    },

    toggleOpen() {
      this.isOpen = !this.isOpen
    },

    saveToLocalStorage() {
      try {
        const data = {
          sessions: this.sessions.slice(0, MAX_SESSIONS),
          currentSessionId: this.currentSessionId
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch {
        // localStorage may be unavailable
      }
    },

    loadFromLocalStorage() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const data = JSON.parse(raw)
          this.sessions = data.sessions || []
          this.currentSessionId = data.currentSessionId || null
        }
      } catch {
        // localStorage may be unavailable
      }
    }
  }
})
