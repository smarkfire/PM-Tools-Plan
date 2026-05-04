import { calculateDuration, addWorkingDays, formatDate } from './date'
import { findTask, flattenTasks } from './wbs'
import type { Task, ValidationResult, TaskStatistics } from '~/types'

export function updateTaskDates(task: Task, startDate: string, duration: number): Task {
  if (!task) return task

  const updated = { ...task }
  updated.startDate = startDate
  updated.duration = duration || 1
  updated.endDate = addWorkingDays(startDate, updated.duration - 1)

  return updated
}

export function calculateTaskDuration(startDate: string, endDate: string): number {
  return calculateDuration(startDate, endDate)
}

export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    '待办': '⏳ 待办',
    '进行中': '🔄 进行中',
    '已完成': '✅ 已完成'
  }
  return statusMap[status] || status
}

export function getStatusClass(status: string): string {
  const classMap: Record<string, string> = {
    '待办': 'status-todo',
    '进行中': 'status-in-progress',
    '已完成': 'status-completed'
  }
  return classMap[status] || ''
}

export function getPriorityText(priority: string): string {
  const priorityMap: Record<string, string> = {
    '高': '🔴 高',
    '中': '🟡 中',
    '低': '🟢 低'
  }
  return priorityMap[priority] || priority
}

export function getPriorityClass(priority: string): string {
  const classMap: Record<string, string> = {
    '高': 'priority-high',
    '中': 'priority-medium',
    '低': 'priority-low'
  }
  return classMap[priority] || ''
}

export function hasChildren(task: Task | null): boolean {
  return !!task && !!task.children && Array.isArray(task.children) && task.children.length > 0
}

export function getAllDescendants(task: Task): Task[] {
  if (!hasChildren(task)) return []

  let descendants: Task[] = []
  task.children.forEach(child => {
    descendants.push(child)
    descendants = descendants.concat(getAllDescendants(child))
  })

  return descendants
}

export function getTaskPath(taskId: string, allTasks: Task[]): Task[] {
  const path: Task[] = []

  function buildPath(tasks: Task[], targetId: string, currentPath: Task[] = []): boolean {
    for (const task of tasks) {
      const newPath = [...currentPath, task]

      if (task.id === targetId) {
        path.push(...newPath)
        return true
      }

      if (hasChildren(task)) {
        if (buildPath(task.children, targetId, newPath)) {
          return true
        }
      }
    }
    return false
  }

  buildPath(allTasks, taskId)
  return path
}

export function canReorderTask(task: Task, allTasks: Task[]): boolean {
  const flat = flattenTasks(allTasks)

  for (const t of flat) {
    if (t.dependencies && t.dependencies.includes(task.id)) {
      return false
    }
  }

  return true
}

export function getTaskCompletion(task: Task | null): number {
  if (!task) return 0

  if (task.status === '已完成') return 100
  if (task.status === '进行中') return 50
  return 0
}

export function calculateProjectProgress(tasks: Task[]): number {
  const flat = flattenTasks(tasks)
  if (flat.length === 0) return 0

  const totalCompletion = flat.reduce((sum, task) => {
    return sum + getTaskCompletion(task)
  }, 0)

  return Math.round(totalCompletion / flat.length)
}

export function getTasksByStatus(tasks: Task[], status: string): Task[] {
  const flat = flattenTasks(tasks)
  return flat.filter(task => task.status === status)
}

export function getTasksByAssignee(tasks: Task[], assigneeId: string): Task[] {
  const flat = flattenTasks(tasks)
  return flat.filter(task => task.assignee === assigneeId)
}

export function getOverdueTasks(tasks: Task[]): Task[] {
  const flat = flattenTasks(tasks)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return flat.filter(task => {
    if (task.status === '已完成') return false
    if (!task.endDate) return false

    const endDate = new Date(task.endDate)
    return endDate < today
  })
}

export function getUpcomingTasks(tasks: Task[], days: number = 7): Task[] {
  const flat = flattenTasks(tasks)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + days)

  return flat.filter(task => {
    if (task.status === '已完成') return false
    if (!task.endDate) return false

    const endDate = new Date(task.endDate)
    return endDate >= today && endDate <= futureDate
  })
}

export function cloneTask(task: Task | null): Task | null {
  if (!task) return null

  return JSON.parse(JSON.stringify(task))
}

export function validateTask(task: Partial<Task>): ValidationResult {
  const errors: string[] = []

  if (!task.name || task.name.trim() === '') {
    errors.push('任务名称不能为空')
  }

  if (!task.startDate) {
    errors.push('开始日期不能为空')
  }

  if (!task.endDate) {
    errors.push('结束日期不能为空')
  }

  if (task.startDate && task.endDate) {
    const start = new Date(task.startDate)
    const end = new Date(task.endDate)

    if (end < start) {
      errors.push('结束日期不能早于开始日期')
    }
  }

  if (task.dependencies && task.id && task.dependencies.includes(task.id)) {
    errors.push('任务不能依赖自己')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function formatTasksForDisplay(tasks: Task[]): (Task & {
  statusText: string
  statusClass: string
  priorityText: string
  priorityClass: string
  hasChildren: boolean
  completion: number
})[] {
  const flat = flattenTasks(tasks)

  return flat.map(task => ({
    ...task,
    statusText: getStatusText(task.status),
    statusClass: getStatusClass(task.status),
    priorityText: getPriorityText(task.priority),
    priorityClass: getPriorityClass(task.priority),
    hasChildren: hasChildren(task),
    completion: getTaskCompletion(task)
  }))
}

export function getTaskStatistics(tasks: Task[]): TaskStatistics {
  const flat = flattenTasks(tasks)

  return {
    total: flat.length,
    todo: getTasksByStatus(tasks, '待办').length,
    inProgress: getTasksByStatus(tasks, '进行中').length,
    completed: getTasksByStatus(tasks, '已完成').length,
    overdue: getOverdueTasks(tasks).length,
    progress: calculateProjectProgress(tasks)
  }
}
