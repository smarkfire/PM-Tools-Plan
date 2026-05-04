import { defineStore } from 'pinia'
import type { ChatSession, ChatMessage } from '~/types'

const STORAGE_KEY = 'plan-tools-chat'
const MAX_MESSAGES_PER_SESSION = 100

interface ChatState {
  sessions: ChatSession[]
  currentSessionId: string | null
  isOpen: boolean
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    sessions: [],
    currentSessionId: null,
    isOpen: false
  }),

  getters: {
    currentSession: (state): ChatSession | null => {
      if (!state.currentSessionId) return null
      return state.sessions.find(s => s.id === state.currentSessionId) || null
    },

    currentMessages: (state): ChatMessage[] => {
      const session = state.sessions.find(s => s.id === state.currentSessionId)
      if (!session) return []
      return session.messages
    }
  },

  actions: {
    generateId(): string {
      return `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },

    createSession(): ChatSession {
      const session: ChatSession = {
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

    addMessage(role: ChatMessage['role'], content: string): void {
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

    updateLastAssistantMessage(content: string): void {
      const session = this.sessions.find(s => s.id === this.currentSessionId)
      if (session && session.messages.length > 0) {
        const lastMsg = session.messages[session.messages.length - 1]
        if (lastMsg.role === 'assistant') {
          lastMsg.content = content
        }
      }
    },

    clearHistory(): void {
      const session = this.sessions.find(s => s.id === this.currentSessionId)
      if (session) {
        session.messages = []
        session.updatedAt = new Date().toISOString()
        this.saveToLocalStorage()
      }
    },

    toggleOpen(): void {
      this.isOpen = !this.isOpen
    },

    setOpen(value: boolean): void {
      this.isOpen = value
    },

    saveToLocalStorage(): void {
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

    loadFromLocalStorage(): void {
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
