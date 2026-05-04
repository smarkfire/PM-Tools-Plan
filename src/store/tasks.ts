import { defineStore } from 'pinia'
import { generateWBS, flattenTasks, findTask, buildTaskTree, getTaskDepth } from '~/utils/wbs'
import { calculateDuration } from '~/utils/date'
import type { Task, DisplaySettings, ColorScheme } from '~/types'

const STORAGE_KEY = 'plan-tools-tasks'
const MAX_WBS_DEPTH = 4

interface TasksState {
  tasks: Task[]
  displaySettings: DisplaySettings
  colorScheme: ColorScheme
  expandedTasks: Set<string>
  lastSaved: string | null
  currentProjectId: string | null
  _useApi: boolean
}

export const useTasksStore = defineStore('tasks', {
  state: (): TasksState => ({
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
      showMilestone: true,
      showDescription: false
    },
    colorScheme: {
      mode: 'status',
      name: 'classic'
    },
    expandedTasks: new Set<string>(),
    lastSaved: null,
    currentProjectId: null,
    _useApi: false
  }),

  getters: {
    flatTaskList: (state): Task[] => {
      return flattenTasks(state.tasks)
    },

    taskById: (state) => (id: string): Task | null => {
      return findTask(state.tasks, id)
    },

    rootTasks: (state): Task[] => {
      return state.tasks.filter(t => !t.parentId)
    },

    hasTasks: (state): boolean => state.tasks.length > 0,

    visibleColumns: (state): string[] => {
      return Object.keys(state.displaySettings)
        .filter(key => state.displaySettings[key as keyof DisplaySettings] && key.startsWith('show'))
        .map(key => key.replace('show', '').toLowerCase())
    },

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

    async loadTasks(projectId: string): Promise<boolean> {
      if (this._useApi && projectId) {
        try {
          const data = await $fetch<{ tasks: Task[]; displaySettings?: DisplaySettings; colorScheme?: ColorScheme; expandedTasks?: string[] }>(`/api/projects/${projectId}/tasks`, {
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

    async _persistTasks(): Promise<void> {
      if (this._useApi && this.currentProjectId) {
        try {
          const result = await $fetch<{ success: boolean; taskCount: number; idMapping?: Record<string, string> }>(`/api/projects/${this.currentProjectId}/tasks`, {
            method: 'PUT',
            headers: this._getAuthHeaders(),
            body: {
              tasks: this.tasks,
              displaySettings: this.displaySettings,
              colorScheme: this.colorScheme,
              expandedTasks: Array.from(this.expandedTasks)
            }
          })
          if (result.idMapping && Object.keys(result.idMapping).length > 0) {
            this._updateTaskIds(this.tasks, result.idMapping)
            const newExpanded = new Set<string>()
            for (const eid of this.expandedTasks) {
              newExpanded.add(result.idMapping[eid] || eid)
            }
            this.expandedTasks = newExpanded
          }
        } catch (e) {
          console.error('Failed to persist tasks to API:', e)
        }
      } else {
        this.saveToLocalStorage()
      }
    },

    _updateTaskIds(taskList: Task[], idMapping: Record<string, string>) {
      for (const task of taskList) {
        if (idMapping[task.id]) {
          const oldId = task.id
          task.id = idMapping[oldId]
          if (task.children && task.children.length > 0) {
            for (const child of task.children) {
              if (child.parentId === oldId) {
                child.parentId = task.id
              }
            }
            this._updateTaskIds(task.children, idMapping)
          }
        } else if (task.children && task.children.length > 0) {
          this._updateTaskIds(task.children, idMapping)
        }
      }
    },

    generateTaskId(): string {
      return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },

    addTask(taskData: Partial<Task>): Task {
      if (taskData.parentId) {
        const parent = findTask(this.tasks, taskData.parentId)
        if (parent) {
          const parentDepth = getTaskDepth(parent, this.tasks)
          if (parentDepth >= MAX_WBS_DEPTH - 1) {
            throw new Error(`已达到最大WBS层级深度（${MAX_WBS_DEPTH}层），无法添加更多子任务`)
          }
        }
      }

      const newTask: Task = {
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
        isMilestone: taskData.isMilestone || false,
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

    updateTask(taskId: string, data: Partial<Task>): void {
      const task = findTask(this.tasks, taskId)
      if (task) {
        const datesChanged = (data.startDate || data.endDate) &&
          (data.startDate !== task.startDate || data.endDate !== task.endDate)

        Object.keys(data).forEach(key => {
          if (key in task) {
            (task as Record<string, unknown>)[key] = data[key as keyof Task]
          }
        })

        if (datesChanged && task.startDate && task.endDate) {
          task.duration = calculateDuration(task.startDate, task.endDate)
        }

        this._persistTasks()
      }
    },

    deleteTask(taskId: string): void {
      const deleteFromList = (list: Task[]): boolean => {
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

    reorderTasks(taskId: string, direction: 'up' | 'down'): void {
      const findParentAndIndex = (list: Task[], id: string, parent: Task | null = null): { list: Task[]; parent: Task | null; index: number } | null => {
        for (let i = 0; i < list.length; i++) {
          if (list[i].id === id) {
            return { list, parent, index: i }
          }
          if (list[i].children && list[i].children.length > 0) {
            const result = findParentAndIndex(list[i].children, id, list[i])
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

    changeTaskLevel(taskId: string, direction: 'in' | 'out'): void {
      const findTaskAndParent = (list: Task[], id: string, parent: Task | null = null): { task: Task; parent: Task | null; list: Task[]; index: number } | null => {
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

    toggleTaskExpand(taskId: string): void {
      if (this.expandedTasks.has(taskId)) {
        this.expandedTasks.delete(taskId)
      } else {
        this.expandedTasks.add(taskId)
      }
      this._persistTasks()
    },

    expandAll(): void {
      const addAllIds = (list: Task[]) => {
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

    collapseAll(): void {
      this.expandedTasks.clear()
      this._persistTasks()
    },

    isTaskExpanded(taskId: string): boolean {
      return this.expandedTasks.has(taskId)
    },

    generateAndSaveWBS(): void {
      this.tasks = generateWBS(this.tasks)
      this._persistTasks()
    },

    saveToLocalStorage(): void {
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

    loadFromLocalStorage(): boolean {
      try {
        const data = localStorage.getItem(STORAGE_KEY)
        if (data) {
          const parsed = JSON.parse(data)
          this.tasks = parsed.tasks || []
          this.displaySettings = parsed.displaySettings || this.displaySettings
          this.colorScheme = parsed.colorScheme || this.colorScheme
          this.expandedTasks = new Set<string>(parsed.expandedTasks || [])
          this.lastSaved = parsed.lastSaved
          return true
        }
      } catch (error) {
        console.error('Failed to load tasks from localStorage:', error)
      }
      return false
    },

    clearTasks(): void {
      this.tasks = []
      this.expandedTasks.clear()
      this.lastSaved = null
      this.currentProjectId = null
      this._persistTasks()
    },

    updateDisplaySettings(settings: Partial<DisplaySettings>): void {
      this.displaySettings = {
        ...this.displaySettings,
        ...settings
      }
      this._persistTasks()
    },

    updateColorScheme(scheme: Partial<ColorScheme>): void {
      this.colorScheme = {
        ...this.colorScheme,
        ...scheme
      }
      this._persistTasks()
    },

    exportToJSON(): string {
      return JSON.stringify({
        tasks: this.tasks,
        displaySettings: this.displaySettings,
        colorScheme: this.colorScheme,
        lastSaved: this.lastSaved
      }, null, 2)
    },

    importFromJSON(jsonString: string): boolean {
      try {
        const data = JSON.parse(jsonString)
        if (data.tasks && Array.isArray(data.tasks)) {
          this.tasks = data.tasks
          this.displaySettings = data.displaySettings || this.displaySettings
          this.colorScheme = data.colorScheme || this.colorScheme
          this.expandedTasks = new Set<string>(data.expandedTasks || [])
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
