import { defineStore } from 'pinia'

const STORAGE_KEY = 'plan-tools-chat'
const MAX_MESSAGES_PER_SESSION = 100

export const useChatStore = defineStore('chat', {
  state: () => ({
    sessions: [],
    currentSessionId: null,
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

    addMessage(role, content) {
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

    updateLastAssistantMessage(content) {
      const session = this.sessions.find(s => s.id === this.currentSessionId)
      if (session && session.messages.length > 0) {
        const lastMsg = session.messages[session.messages.length - 1]
        if (lastMsg.role === 'assistant') {
          lastMsg.content = content
        }
      }
    },

    clearHistory() {
      const session = this.sessions.find(s => s.id === this.currentSessionId)
      if (session) {
        session.messages = []
        session.updatedAt = new Date().toISOString()
        this.saveToLocalStorage()
      }
    },

    toggleOpen() {
      this.isOpen = !this.isOpen
    },

    setOpen(value) {
      this.isOpen = value
    },

    saveToLocalStorage() {
      try {
        const data = {
          sessions: this.sessions,
          currentSessionId: this.currentSessionId
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch (error) {
        console.error('Failed to save chat to localStorage:', error)
      }
    },

    loadFromLocalStorage() {
      try {
        const data = localStorage.getItem(STORAGE_KEY)
        if (data) {
          const parsed = JSON.parse(data)
          this.sessions = parsed.sessions || []
          this.currentSessionId = parsed.currentSessionId || null
        }
      } catch (error) {
        console.error('Failed to load chat from localStorage:', error)
      }
    }
  }
})
