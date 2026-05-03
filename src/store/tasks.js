import { defineStore } from 'pinia'
import { generateWBS, flattenTasks, findTask, buildTaskTree, getTaskDepth } from '~/utils/wbs'
import { calculateDuration } from '~/utils/date'

const STORAGE_KEY = 'plan-tools-tasks'

const MAX_WBS_DEPTH = 4

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    tasks: [],
    displaySettings: {
      showWBS: true,
      showName: true,
      showStartDate: true,
      showEndDate: true,
      showDuration: true,
      showDeliverable: true,
      showDependencies: false,
      showAssignee: true,
      showPriority: true,
      showStatus: true,
      showDescription: false
    },
    colorScheme: {
      mode: 'status',
      name: 'classic'
    },
    expandedTasks: new Set(),
    lastSaved: null,
    currentProjectId: null,
    _useApi: false
  }),

  getters: {
    flatTaskList: (state) => {
      return flattenTasks(state.tasks)
    },

    taskById: (state) => (id) => {
      return findTask(state.tasks, id)
    },

    rootTasks: (state) => {
      return state.tasks.filter(t => !t.parentId)
    },

    hasTasks: (state) => state.tasks.length > 0,

    visibleColumns: (state) => {
      return Object.keys(state.displaySettings)
        .filter(key => state.displaySettings[key] && key.startsWith('show'))
        .map(key => key.replace('show', '').toLowerCase())
    },

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

    async loadTasks(projectId) {
      if (this._useApi && projectId) {
        try {
          const data = await $fetch(`/api/projects/${projectId}/tasks`, {
            headers: this._getAuthHeaders()
          })
          this.tasks = data.tasks || []
          this.displaySettings = data.displaySettings || this.displaySettings
          this.colorScheme = data.colorScheme || this.colorScheme
          this.expandedTasks = new Set(data.expandedTasks || [])
          this.currentProjectId = projectId
          return true
        } catch (e) {
          console.error('Failed to load tasks from API:', e)
          return false
        }
      }
      return this.loadFromLocalStorage()
    },

    async _persistTasks() {
      if (this._useApi && this.currentProjectId) {
        try {
          await $fetch(`/api/projects/${this.currentProjectId}/tasks`, {
            method: 'PUT',
            headers: this._getAuthHeaders(),
            body: {
              tasks: this.tasks,
              displaySettings: this.displaySettings,
              colorScheme: this.colorScheme,
              expandedTasks: Array.from(this.expandedTasks)
            }
          })
        } catch (e) {
          console.error('Failed to persist tasks to API:', e)
        }
      } else {
        this.saveToLocalStorage()
      }
    },

    generateTaskId() {
      return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },

    addTask(taskData) {
      if (taskData.parentId) {
        const parent = findTask(this.tasks, taskData.parentId)
        if (parent) {
          const parentDepth = getTaskDepth(parent, this.tasks)
          if (parentDepth >= MAX_WBS_DEPTH - 1) {
            throw new Error(`已达到最大WBS层级深度（${MAX_WBS_DEPTH}层），无法添加更多子任务`)
          }
        }
      }

      const newTask = {
        id: this.generateTaskId(),
        wbs: '',
        name: taskData.name || '',
        startDate: taskData.startDate || '',
        endDate: taskData.endDate || '',
        duration: taskData.duration || 1,
        deliverable: taskData.deliverable || '',
        dependencies: taskData.dependencies || [],
        assignee: taskData.assignee || '',
        priority: taskData.priority || '中',
        status: taskData.status || '待办',
        description: taskData.description || '',
        parentId: taskData.parentId || null,
        children: []
      }

      if (taskData.parentId) {
        const parent = findTask(this.tasks, taskData.parentId)
        if (parent) {
          if (!parent.children) {
            parent.children = []
          }
          parent.children.push(newTask)
        }
      } else {
        this.tasks.push(newTask)
      }

      this.generateAndSaveWBS()
      return newTask
    },

    updateTask(taskId, data) {
      const task = findTask(this.tasks, taskId)
      if (task) {
        const datesChanged = (data.startDate || data.endDate) &&
          (data.startDate !== task.startDate || data.endDate !== task.endDate)

        Object.keys(data).forEach(key => {
          if (key in task) {
            task[key] = data[key]
          }
        })

        if (datesChanged && task.startDate && task.endDate) {
          task.duration = calculateDuration(task.startDate, task.endDate)
        }

        this._persistTasks()
      }
    },

    deleteTask(taskId) {
      const deleteFromList = (list) => {
        const index = list.findIndex(t => t.id === taskId)
        if (index !== -1) {
          list.splice(index, 1)
          return true
        }
        for (const task of list) {
          if (task.children && task.children.length > 0) {
            if (deleteFromList(task.children)) {
              return true
            }
          }
        }
        return false
      }

      deleteFromList(this.tasks)
      this.generateAndSaveWBS()
    },

    reorderTasks(taskId, direction) {
      const findParentAndIndex = (list, id, parent = null, index = 0) => {
        for (let i = 0; i < list.length; i++) {
          if (list[i].id === id) {
            return { list, parent, index: i }
          }
          if (list[i].children && list[i].children.length > 0) {
            const result = findParentAndIndex(list[i].children, id, list[i], i)
            if (result) return result
          }
        }
        return null
      }

      const result = findParentAndIndex(this.tasks, taskId)
      if (!result) return

      const { list, index } = result
      const newIndex = direction === 'up' ? index - 1 : index + 1

      if (newIndex < 0 || newIndex >= list.length) return

      ;[list[index], list[newIndex]] = [list[newIndex], list[index]]

      this.generateAndSaveWBS()
    },

    changeTaskLevel(taskId, direction) {
      const findTaskAndParent = (list, id, parent = null) => {
        for (let i = 0; i < list.length; i++) {
          if (list[i].id === id) {
            return { task: list[i], parent, list, index: i }
          }
          if (list[i].children && list[i].children.length > 0) {
            const result = findTaskAndParent(list[i].children, id, list[i])
            if (result) return result
          }
        }
        return null
      }

      const result = findTaskAndParent(this.tasks, taskId)
      if (!result) return

      const { task, parent, list, index } = result

      if (direction === 'out' && parent) {
        const parentIndex = this.tasks.findIndex(t => t.id === parent.id)
        if (parentIndex !== -1 && parentIndex < this.tasks.length - 1) {
          list.splice(index, 1)
          this.tasks.splice(parentIndex + 1, 0, task)
          task.parentId = parent.parentId
        }
      } else if (direction === 'in' && index > 0) {
        const newParent = list[index - 1]
        const newParentDepth = getTaskDepth(newParent, this.tasks)
        if (newParentDepth >= MAX_WBS_DEPTH - 1) {
          throw new Error(`已达到最大WBS层级深度（${MAX_WBS_DEPTH}层），无法继续缩进`)
        }

        if (!newParent.children) {
          newParent.children = []
        }
        list.splice(index, 1)
        newParent.children.push(task)
        task.parentId = newParent.id
      }

      this.generateAndSaveWBS()
    },

    toggleTaskExpand(taskId) {
      if (this.expandedTasks.has(taskId)) {
        this.expandedTasks.delete(taskId)
      } else {
        this.expandedTasks.add(taskId)
      }
      this._persistTasks()
    },

    expandAll() {
      const addAllIds = (list) => {
        list.forEach(task => {
          if (task.children && task.children.length > 0) {
            this.expandedTasks.add(task.id)
            addAllIds(task.children)
          }
        })
      }
      addAllIds(this.tasks)
      this._persistTasks()
    },

    collapseAll() {
      this.expandedTasks.clear()
      this._persistTasks()
    },

    isTaskExpanded(taskId) {
      return this.expandedTasks.has(taskId)
    },

    generateAndSaveWBS() {
      this.tasks = generateWBS(this.tasks)
      this._persistTasks()
    },

    saveToLocalStorage() {
      try {
        const dataToSave = {
          tasks: this.tasks,
          displaySettings: this.displaySettings,
          colorScheme: this.colorScheme,
          expandedTasks: Array.from(this.expandedTasks),
          lastSaved: new Date().toISOString()
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
        this.lastSaved = dataToSave.lastSaved
      } catch (error) {
        console.error('Failed to save tasks to localStorage:', error)
      }
    },

    loadFromLocalStorage() {
      try {
        const data = localStorage.getItem(STORAGE_KEY)
        if (data) {
          const parsed = JSON.parse(data)
          this.tasks = parsed.tasks || []
          this.displaySettings = parsed.displaySettings || this.displaySettings
          this.colorScheme = parsed.colorScheme || this.colorScheme
          this.expandedTasks = new Set(parsed.expandedTasks || [])
          this.lastSaved = parsed.lastSaved
          return true
        }
      } catch (error) {
        console.error('Failed to load tasks from localStorage:', error)
      }
      return false
    },

    clearTasks() {
      this.tasks = []
      this.expandedTasks.clear()
      this.lastSaved = null
      this.currentProjectId = null
      this._persistTasks()
    },

    updateDisplaySettings(settings) {
      this.displaySettings = {
        ...this.displaySettings,
        ...settings
      }
      this._persistTasks()
    },

    updateColorScheme(scheme) {
      this.colorScheme = {
        ...this.colorScheme,
        ...scheme
      }
      this._persistTasks()
    },

    exportToJSON() {
      return JSON.stringify({
        tasks: this.tasks,
        displaySettings: this.displaySettings,
        colorScheme: this.colorScheme,
        lastSaved: this.lastSaved
      }, null, 2)
    },

    importFromJSON(jsonString) {
      try {
        const data = JSON.parse(jsonString)
        if (data.tasks && Array.isArray(data.tasks)) {
          this.tasks = data.tasks
          this.displaySettings = data.displaySettings || this.displaySettings
          this.colorScheme = data.colorScheme || this.colorScheme
          this.expandedTasks = new Set(data.expandedTasks || [])
          this.lastSaved = data.lastSaved
          this._persistTasks()
          return true
        }
      } catch (error) {
        console.error('Failed to import tasks:', error)
      }
      return false
    }
  }
})
