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
    }
  }),

  getters: {
    memberList: (state) => state.project.members,
    memberOptions: (state) => state.project.members.map(m => ({
      label: m.name,
      value: m.id
    })),
    memberById: (state) => (id) => state.project.members.find(m => m.id === id),
    hasProject: (state) => !!state.project.id
  },

  actions: {
    generateId() {
      return `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },

    generateMemberId() {
      return `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },

    setProjectInfo(info) {
      this.project = {
        ...this.project,
        ...info
      }
      if (!this.project.id) {
        this.project.id = this.generateId()
      }
      this.saveToLocalStorage()
    },

    addMember(member) {
      const newMember = {
        id: this.generateMemberId(),
        name: member.name || '',
        phone: member.phone || '',
        email: member.email || '',
        role: member.role || ''
      }
      this.project.members.push(newMember)
      this.saveToLocalStorage()
      return newMember
    },

    updateMember(memberId, data) {
      const index = this.project.members.findIndex(m => m.id === memberId)
      if (index !== -1) {
        this.project.members[index] = {
          ...this.project.members[index],
          ...data
        }
        this.saveToLocalStorage()
      }
    },

    deleteMember(memberId) {
      const index = this.project.members.findIndex(m => m.id === memberId)
      if (index !== -1) {
        this.project.members.splice(index, 1)
        this.saveToLocalStorage()
      }
    },

    deleteMembers(memberIds) {
      this.project.members = this.project.members.filter(m => !memberIds.includes(m.id))
      this.saveToLocalStorage()
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
      this.saveToLocalStorage()
    },

    exportToJSON() {
      return JSON.stringify(this.project, null, 2)
    },

    importFromJSON(jsonString) {
      try {
        const data = JSON.parse(jsonString)
        // Validate basic structure
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
