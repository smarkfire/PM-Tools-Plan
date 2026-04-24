import { defineStore } from 'pinia'
import { generateWBS, flattenTasks, findTask, buildTaskTree, getTaskDepth } from '@/utils/wbs'
import { calculateDuration } from '@/utils/date'

const STORAGE_KEY = 'plan-tools-tasks'

// Maximum WBS depth level (1 = root, 2 = first level children, etc.)
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
    expandedTasks: new Set(),
    lastSaved: null
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
    }
  },

  actions: {
    generateTaskId() {
      return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },

    addTask(taskData) {
      // Check WBS depth limit if adding as a child
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
        // Check if dates are being updated
        const datesChanged = (data.startDate || data.endDate) &&
          (data.startDate !== task.startDate || data.endDate !== task.endDate)

        // Update each field individually to ensure reactivity
        Object.keys(data).forEach(key => {
          if (key in task) {
            task[key] = data[key]
          }
        })

        // Auto-recalculate duration if dates changed
        if (datesChanged && task.startDate && task.endDate) {
          task.duration = calculateDuration(task.startDate, task.endDate)
        }

        this.saveToLocalStorage()
        console.log('Task updated in store:', taskId, data)
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

      // Swap tasks
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
        // Move out (become sibling of parent)
        const parentIndex = this.tasks.findIndex(t => t.id === parent.id)
        if (parentIndex !== -1 && parentIndex < this.tasks.length - 1) {
          // Remove from current location
          list.splice(index, 1)
          // Insert after parent
          this.tasks.splice(parentIndex + 1, 0, task)
          task.parentId = parent.parentId
        }
      } else if (direction === 'in' && index > 0) {
        // Move in (become child of previous sibling)
        const newParent = list[index - 1]

        // Check depth limit before moving
        const newParentDepth = getTaskDepth(newParent, this.tasks)
        if (newParentDepth >= MAX_WBS_DEPTH - 1) {
          throw new Error(`已达到最大WBS层级深度（${MAX_WBS_DEPTH}层），无法继续缩进`)
        }

        if (!newParent.children) {
          newParent.children = []
        }
        // Remove from current location
        list.splice(index, 1)
        // Add to new parent's children
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
      this.saveToLocalStorage()
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
      this.saveToLocalStorage()
    },

    collapseAll() {
      this.expandedTasks.clear()
      this.saveToLocalStorage()
    },

    isTaskExpanded(taskId) {
      return this.expandedTasks.has(taskId)
    },

    generateAndSaveWBS() {
      this.tasks = generateWBS(this.tasks)
      this.saveToLocalStorage()
    },

    saveToLocalStorage() {
      try {
        const dataToSave = {
          tasks: this.tasks,
          displaySettings: this.displaySettings,
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
      this.saveToLocalStorage()
    },

    updateDisplaySettings(settings) {
      this.displaySettings = {
        ...this.displaySettings,
        ...settings
      }
      this.saveToLocalStorage()
    },

    exportToJSON() {
      return JSON.stringify({
        tasks: this.tasks,
        displaySettings: this.displaySettings,
        lastSaved: this.lastSaved
      }, null, 2)
    },

    importFromJSON(jsonString) {
      try {
        const data = JSON.parse(jsonString)
        if (data.tasks && Array.isArray(data.tasks)) {
          this.tasks = data.tasks
          this.displaySettings = data.displaySettings || this.displaySettings
          this.expandedTasks = new Set(data.expandedTasks || [])
          this.lastSaved = data.lastSaved
          this.saveToLocalStorage()
          return true
        }
      } catch (error) {
        console.error('Failed to import tasks:', error)
      }
      return false
    }
  }
})
