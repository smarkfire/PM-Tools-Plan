import { defineStore } from 'pinia'
import type { Project, Member } from '~/types'

const STORAGE_KEY = 'plan-tools-project'

interface ProjectState {
  project: Project
  currentProjectId: string | null
  _useApi: boolean
}

export const useProjectStore = defineStore('project', {
  state: (): ProjectState => ({
    project: {
      id: '',
      name: '',
      startDate: '',
      endDate: '',
      description: '',
      members: []
    },
    currentProjectId: null,
    _useApi: false
  }),

  getters: {
    memberList: (state): Member[] => state.project.members,
    memberOptions: (state): { label: string; value: string }[] => state.project.members.map(m => ({
      label: m.name,
      value: m.id
    })),
    memberById: (state) => (id: string): Member | undefined => state.project.members.find(m => m.id === id),
    hasProject: (state): boolean => !!state.project.id,
    useApi: (state): boolean => state._useApi
  },

  actions: {
    _getAuthHeaders(): Record<string, string> {
      const token = localStorage.getItem('auth_token')
      return token ? { Authorization: `Bearer ${token}` } : {}
    },

    setApiMode(enabled: boolean): void {
      this._useApi = enabled
    },

    async loadProject(projectId: string): Promise<boolean> {
      if (this._useApi && projectId) {
        try {
          const data = await $fetch<Project>(`/api/projects/${projectId}`, {
            headers: this._getAuthHeaders()
          })
          this.project = {
            id: data.id,
            name: data.name || '',
            startDate: data.startDate || '',
            endDate: data.endDate || '',
            description: data.description || '',
            members: data.members || []
          }
          this.currentProjectId = projectId
          return true
        } catch (e) {
          console.error('Failed to load project from API:', e)
          return false
        }
      }
      return this.loadFromLocalStorage()
    },

    generateId(): string {
      return `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },

    generateMemberId(): string {
      return `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },

    async setProjectInfo(info: Partial<Project>): Promise<void> {
      this.project = {
        ...this.project,
        ...info
      }
      if (!this.project.id) {
        this.project.id = this.generateId()
      }

      if (this._useApi && this.currentProjectId) {
        try {
          await $fetch(`/api/projects/${this.currentProjectId}`, {
            method: 'PUT',
            headers: this._getAuthHeaders(),
            body: {
              name: this.project.name,
              startDate: this.project.startDate,
              endDate: this.project.endDate,
              description: this.project.description,
              members: this.project.members
            }
          })
        } catch (e) {
          console.error('Failed to save project to API:', e)
        }
      } else {
        this.saveToLocalStorage()
      }
    },

    async addMember(member: Partial<Member>): Promise<Member> {
      const newMember: Member = {
        id: this.generateMemberId(),
        name: member.name || '',
        phone: member.phone || '',
        email: member.email || '',
        role: member.role || ''
      }
      this.project.members.push(newMember)

      if (this._useApi && this.currentProjectId) {
        try {
          await $fetch(`/api/projects/${this.currentProjectId}`, {
            method: 'PUT',
            headers: this._getAuthHeaders(),
            body: { members: this.project.members }
          })
        } catch (e) {
          console.error('Failed to save members to API:', e)
        }
      } else {
        this.saveToLocalStorage()
      }
      return newMember
    },

    async updateMember(memberId: string, data: Partial<Member>): Promise<void> {
      const index = this.project.members.findIndex(m => m.id === memberId)
      if (index !== -1) {
        this.project.members[index] = {
          ...this.project.members[index],
          ...data
        }
        if (this._useApi && this.currentProjectId) {
          try {
            await $fetch(`/api/projects/${this.currentProjectId}`, {
              method: 'PUT',
              headers: this._getAuthHeaders(),
              body: { members: this.project.members }
            })
          } catch (e) {
            console.error('Failed to update member via API:', e)
          }
        } else {
          this.saveToLocalStorage()
        }
      }
    },

    async deleteMember(memberId: string): Promise<void> {
      const index = this.project.members.findIndex(m => m.id === memberId)
      if (index !== -1) {
        this.project.members.splice(index, 1)
        if (this._useApi && this.currentProjectId) {
          try {
            await $fetch(`/api/projects/${this.currentProjectId}`, {
              method: 'PUT',
              headers: this._getAuthHeaders(),
              body: { members: this.project.members }
            })
          } catch (e) {
            console.error('Failed to delete member via API:', e)
          }
        } else {
          this.saveToLocalStorage()
        }
      }
    },

    async deleteMembers(memberIds: string[]): Promise<void> {
      this.project.members = this.project.members.filter(m => !memberIds.includes(m.id))
      if (this._useApi && this.currentProjectId) {
        try {
          await $fetch(`/api/projects/${this.currentProjectId}`, {
            method: 'PUT',
            headers: this._getAuthHeaders(),
            body: { members: this.project.members }
          })
        } catch (e) {
          console.error('Failed to delete members via API:', e)
        }
      } else {
        this.saveToLocalStorage()
      }
    },

    saveToLocalStorage(): void {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.project))
      } catch (error) {
        console.error('Failed to save project to localStorage:', error)
      }
    },

    loadFromLocalStorage(): boolean {
      try {
        const data = localStorage.getItem(STORAGE_KEY)
        if (data) {
          this.project = JSON.parse(data)
          return true
        }
      } catch (error) {
        console.error('Failed to load project from localStorage:', error)
      }
      return false
    },

    clearProject(): void {
      this.project = {
        id: '',
        name: '',
        startDate: '',
        endDate: '',
        description: '',
        members: []
      }
      this.currentProjectId = null
      this.saveToLocalStorage()
    },

    exportToJSON(): string {
      return JSON.stringify(this.project, null, 2)
    },

    importFromJSON(jsonString: string): boolean {
      try {
        const data = JSON.parse(jsonString)
        if (typeof data === 'object' && data !== null) {
          this.project = {
            id: data.id || this.generateId(),
            name: data.name || '',
            startDate: data.startDate || '',
            endDate: data.endDate || '',
            description: data.description || '',
            members: Array.isArray(data.members) ? data.members : []
          }
          this.saveToLocalStorage()
          return true
        }
      } catch (error) {
        console.error('Failed to import project:', error)
      }
      return false
    }
  }
})
