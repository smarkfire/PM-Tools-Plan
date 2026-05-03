import { defineStore } from 'pinia'

const STORAGE_KEY = 'plan-tools-project'

export const useProjectStore = defineStore('project', {
  state: () => ({
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
    memberList: (state) => state.project.members,
    memberOptions: (state) => state.project.members.map(m => ({
      label: m.name,
      value: m.id
    })),
    memberById: (state) => (id) => state.project.members.find(m => m.id === id),
    hasProject: (state) => !!state.project.id,
    useApi: (state) => state._useApi
  },

  actions: {
    _getAuthHeaders() {
      const token = localStorage.getItem('auth_token')
      return token ? { Authorization: `Bearer ${token}` } : {}
    },

    setApiMode(enabled) {
      this._useApi = enabled
    },

    async loadProject(projectId) {
      if (this._useApi && projectId) {
        try {
          const data = await $fetch(`/api/projects/${projectId}`, {
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

    generateId() {
      return `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },

    generateMemberId() {
      return `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },

    async setProjectInfo(info) {
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

    async addMember(member) {
      const newMember = {
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

    async updateMember(memberId, data) {
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

    async deleteMember(memberId) {
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

    async deleteMembers(memberIds) {
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

    saveToLocalStorage() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.project))
      } catch (error) {
        console.error('Failed to save project to localStorage:', error)
      }
    },

    loadFromLocalStorage() {
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

    clearProject() {
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

    exportToJSON() {
      return JSON.stringify(this.project, null, 2)
    },

    importFromJSON(jsonString) {
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
