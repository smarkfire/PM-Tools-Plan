import { calculateDuration, addWorkingDays, formatDate } from './date'
import { findTask, flattenTasks } from './wbs'

/**
 * Update task dates based on start date and duration
 * @param {Object} task - Task to update
 * @param {String} startDate - New start date
 * @param {Number} duration - Duration in working days
 * @returns {Object} Updated task
 */
export function updateTaskDates(task, startDate, duration) {
  if (!task) return task

  const updated = { ...task }
  updated.startDate = startDate
  updated.duration = duration || 1
  updated.endDate = addWorkingDays(startDate, updated.duration - 1)

  return updated
}

/**
 * Calculate task duration from dates
 * @param {String} startDate - Start date
 * @param {String} endDate - End date
 * @returns {Number} Duration in working days
 */
export function calculateTaskDuration(startDate, endDate) {
  return calculateDuration(startDate, endDate)
}

/**
 * Get task status text with emoji
 * @param {String} status - Task status
 * @returns {String} Status text with emoji
 */
export function getStatusText(status) {
  const statusMap = {
    '待办': '⏳ 待办',
    '进行中': '🔄 进行中',
    '已完成': '✅ 已完成'
  }
  return statusMap[status] || status
}

/**
 * Get task status color class
 * @param {String} status - Task status
 * @returns {String} CSS class name
 */
export function getStatusClass(status) {
  const classMap = {
    '待办': 'status-todo',
    '进行中': 'status-in-progress',
    '已完成': 'status-completed'
  }
  return classMap[status] || ''
}

/**
 * Get priority text with emoji
 * @param {String} priority - Task priority
 * @returns {String} Priority text with emoji
 */
export function getPriorityText(priority) {
  const priorityMap = {
    '高': '🔴 高',
    '中': '🟡 中',
    '低': '🟢 低'
  }
  return priorityMap[priority] || priority
}

/**
 * Get priority color class
 * @param {String} priority - Task priority
 * @returns {String} CSS class name
 */
export function getPriorityClass(priority) {
  const classMap = {
    '高': 'priority-high',
    '中': 'priority-medium',
    '低': 'priority-low'
  }
  return classMap[priority] || ''
}

/**
 * Check if task has children
 * @param {Object} task - Task to check
 * @returns {Boolean} True if task has children
 */
export function hasChildren(task) {
  return task && task.children && Array.isArray(task.children) && task.children.length > 0
}

/**
 * Get all descendant tasks of a task
 * @param {Object} task - Parent task
 * @returns {Array} Array of descendant tasks
 */
export function getAllDescendants(task) {
  if (!hasChildren(task)) return []

  let descendants = []
  task.children.forEach(child => {
    descendants.push(child)
    descendants = descendants.concat(getAllDescendants(child))
  })

  return descendants
}

/**
 * Get all tasks in the path from root to the task
 * @param {String} taskId - Task ID
 * @param {Array} allTasks - All tasks
 * @returns {Array} Path of tasks from root to target
 */
export function getTaskPath(taskId, allTasks) {
  const path = []

  function buildPath(tasks, targetId, currentPath = []) {
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

/**
 * Check if a task can be reordered (not restricted by dependencies)
 * @param {Object} task - Task to check
 * @param {Array} allTasks - All tasks
 * @returns {Boolean} True if task can be reordered
 */
export function canReorderTask(task, allTasks) {
  // Task can be reordered if no other tasks depend on it
  const flatTasks = flattenTasks(allTasks)

  for (const t of flatTasks) {
    if (t.dependencies && t.dependencies.includes(task.id)) {
      return false
    }
  }

  return true
}

/**
 * Get task completion percentage
 * @param {Object} task - Task to check
 * @returns {Number} Completion percentage (0-100)
 */
export function getTaskCompletion(task) {
  if (!task) return 0

  if (task.status === '已完成') return 100
  if (task.status === '进行中') return 50
  return 0
}

/**
 * Calculate project progress based on tasks
 * @param {Array} tasks - All tasks
 * @returns {Number} Overall progress percentage (0-100)
 */
export function calculateProjectProgress(tasks) {
  const flatTasks = flattenTasks(tasks)
  if (flatTasks.length === 0) return 0

  const totalCompletion = flatTasks.reduce((sum, task) => {
    return sum + getTaskCompletion(task)
  }, 0)

  return Math.round(totalCompletion / flatTasks.length)
}

/**
 * Get tasks by status
 * @param {Array} tasks - All tasks
 * @param {String} status - Status to filter by
 * @returns {Array} Tasks with the specified status
 */
export function getTasksByStatus(tasks, status) {
  const flatTasks = flattenTasks(tasks)
  return flatTasks.filter(task => task.status === status)
}

/**
 * Get tasks by assignee
 * @param {Array} tasks - All tasks
 * @param {String} assigneeId - Assignee ID
 * @returns {Array} Tasks assigned to the specified person
 */
export function getTasksByAssignee(tasks, assigneeId) {
  const flatTasks = flattenTasks(tasks)
  return flatTasks.filter(task => task.assignee === assigneeId)
}

/**
 * Get overdue tasks
 * @param {Array} tasks - All tasks
 * @returns {Array} Overdue tasks (not completed and past due date)
 */
export function getOverdueTasks(tasks) {
  const flatTasks = flattenTasks(tasks)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return flatTasks.filter(task => {
    if (task.status === '已完成') return false
    if (!task.endDate) return false

    const endDate = new Date(task.endDate)
    return endDate < today
  })
}

/**
 * Get upcoming tasks (due within specified days)
 * @param {Array} tasks - All tasks
 * @param {Number} days - Number of days to look ahead
 * @returns {Array} Upcoming tasks
 */
export function getUpcomingTasks(tasks, days = 7) {
  const flatTasks = flattenTasks(tasks)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + days)

  return flatTasks.filter(task => {
    if (task.status === '已完成') return false
    if (!task.endDate) return false

    const endDate = new Date(task.endDate)
    return endDate >= today && endDate <= futureDate
  })
}

/**
 * Clone task for editing (creates a deep copy)
 * @param {Object} task - Task to clone
 * @returns {Object} Cloned task
 */
export function cloneTask(task) {
  if (!task) return null

  return JSON.parse(JSON.stringify(task))
}

/**
 * Validate task data
 * @param {Object} task - Task to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateTask(task) {
  const errors = []

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

  if (task.dependencies && task.dependencies.includes(task.id)) {
    errors.push('任务不能依赖自己')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Format task list for display
 * @param {Array} tasks - Tasks to format
 * @returns {Array} Formatted task list with additional display properties
 */
export function formatTasksForDisplay(tasks) {
  const flatTasks = flattenTasks(tasks)

  return flatTasks.map(task => ({
    ...task,
    statusText: getStatusText(task.status),
    statusClass: getStatusClass(task.status),
    priorityText: getPriorityText(task.priority),
    priorityClass: getPriorityClass(task.priority),
    hasChildren: hasChildren(task),
    completion: getTaskCompletion(task)
  }))
}

/**
 * Get task statistics
 * @param {Array} tasks - All tasks
 * @returns {Object} Statistics object
 */
export function getTaskStatistics(tasks) {
  const flatTasks = flattenTasks(tasks)

  return {
    total: flatTasks.length,
    todo: getTasksByStatus(tasks, '待办').length,
    inProgress: getTasksByStatus(tasks, '进行中').length,
    completed: getTasksByStatus(tasks, '已完成').length,
    overdue: getOverdueTasks(tasks).length,
    progress: calculateProjectProgress(tasks)
  }
}
