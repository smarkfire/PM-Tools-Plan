/**
 * Generate WBS (Work Breakdown Structure) numbers for tasks
 * @param {Array} tasks - Array of tasks with potential nested children
 * @returns {Array} Tasks with WBS numbers assigned
 */
export function generateWBS(tasks, prefix = '', startIndex = 0) {
  if (!Array.isArray(tasks)) return []

  return tasks.map((task, index) => {
    const wbsNumber = startIndex + index + 1
    const currentWBS = prefix ? `${prefix}.${wbsNumber}` : `${wbsNumber}`

    const updatedTask = {
      ...task,
      wbs: currentWBS
    }

    // Recursively generate WBS for children
    if (task.children && Array.isArray(task.children) && task.children.length > 0) {
      updatedTask.children = generateWBS(task.children, currentWBS, 0)
    }

    return updatedTask
  })
}

/**
 * Flatten nested task tree into a single array
 * @param {Array} tasks - Array of tasks with potential nested children
 * @returns {Array} Flattened array of tasks
 */
export function flattenTasks(tasks) {
  if (!Array.isArray(tasks)) return []

  const result = []

  function flatten(list) {
    list.forEach(task => {
      result.push(task)
      if (task.children && Array.isArray(task.children) && task.children.length > 0) {
        flatten(task.children)
      }
    })
  }

  flatten(tasks)
  return result
}

/**
 * Find a task by ID in nested structure
 * @param {Array} tasks - Array of tasks to search
 * @param {String} taskId - ID of the task to find
 * @returns {Object|null} Found task or null
 */
export function findTask(tasks, taskId) {
  if (!Array.isArray(tasks)) return null

  for (const task of tasks) {
    if (task.id === taskId) {
      return task
    }
    if (task.children && Array.isArray(task.children) && task.children.length > 0) {
      const found = findTask(task.children, taskId)
      if (found) return found
    }
  }

  return null
}

/**
 * Find parent task of a given task
 * @param {Array} tasks - Array of tasks to search
 * @param {String} taskId - ID of the child task
 * @returns {Object|null} Parent task or null
 */
export function findParentTask(tasks, taskId) {
  if (!Array.isArray(tasks)) return null

  for (const task of tasks) {
    if (task.children && Array.isArray(task.children)) {
      if (task.children.some(child => child.id === taskId)) {
        return task
      }
      const found = findParentTask(task.children, taskId)
      if (found) return found
    }
  }

  return null
}

/**
 * Build task tree from flat list with parentId references
 * @param {Array} flatTasks - Flat array of tasks
 * @returns {Array} Nested tree structure
 */
export function buildTaskTree(flatTasks) {
  if (!Array.isArray(flatTasks)) return []

  const taskMap = new Map()
  const rootTasks = []

  // Create copies of all tasks
  flatTasks.forEach(task => {
    taskMap.set(task.id, { ...task, children: [] })
  })

  // Build tree structure
  taskMap.forEach(task => {
    if (task.parentId && taskMap.has(task.parentId)) {
      const parent = taskMap.get(task.parentId)
      parent.children.push(task)
    } else {
      rootTasks.push(task)
    }
  })

  return rootTasks
}

/**
 * Sort tasks by WBS number
 * @param {Array} tasks - Array of tasks to sort
 * @returns {Array} Sorted tasks
 */
export function sortTasksByWBS(tasks) {
  if (!Array.isArray(tasks)) return []

  return [...tasks].sort((a, b) => {
    const wbsA = a.wbs || ''
    const wbsB = b.wbs || ''

    const partsA = wbsA.split('.').map(Number)
    const partsB = wbsB.split('.').map(Number)

    const maxLength = Math.max(partsA.length, partsB.length)

    for (let i = 0; i < maxLength; i++) {
      const numA = partsA[i] || 0
      const numB = partsB[i] || 0

      if (numA !== numB) {
        return numA - numB
      }
    }

    return 0
  })
}

/**
 * Get task depth (hierarchy level)
 * @param {Object} task - Task object
 * @param {Array} allTasks - All tasks for searching
 * @returns {Number} Depth level (0 for root tasks)
 */
export function getTaskDepth(task, allTasks) {
  let depth = 0
  let currentTask = task

  while (currentTask && currentTask.parentId) {
    depth++
    currentTask = findTask(allTasks, currentTask.parentId)
  }

  return depth
}

/**
 * Check if a task is a descendant of another task
 * @param {Object} potentialDescendant - The potential descendant task
 * @param {Object} ancestor - The potential ancestor task
 * @returns {Boolean} True if descendant
 */
export function isTaskDescendant(potentialDescendant, ancestor) {
  if (!ancestor.children || !Array.isArray(ancestor.children)) {
    return false
  }

  if (ancestor.children.some(child => child.id === potentialDescendant.id)) {
    return true
  }

  for (const child of ancestor.children) {
    if (isTaskDescendant(potentialDescendant, child)) {
      return true
    }
  }

  return false
}

/**
 * Get all sibling tasks of a given task
 * @param {Object} task - The task
 * @param {Array} allTasks - All tasks
 * @returns {Array} Array of sibling tasks (including the task itself)
 */
export function getSiblingTasks(task, allTasks) {
  if (!task.parentId) {
    return allTasks.filter(t => !t.parentId)
  }

  const parent = findTask(allTasks, task.parentId)
  return parent && parent.children ? parent.children : []
}

/**
 * Reorder task within its sibling list
 * @param {Array} tasks - All tasks
 * @param {String} taskId - ID of task to move
 * @param {Number} newIndex - New index position
 * @returns {Array} Updated tasks array
 */
export function reorderTask(tasks, taskId, newIndex) {
  const siblings = getSiblingTasks(findTask(tasks, taskId), tasks)
  const currentIndex = siblings.findIndex(t => t.id === taskId)

  if (currentIndex === newIndex || currentIndex === -1) {
    return tasks
  }

  const [movedTask] = siblings.splice(currentIndex, 1)
  siblings.splice(newIndex, 0, movedTask)

  return tasks
}
