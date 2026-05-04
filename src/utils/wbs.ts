import type { Task } from '~/types'

export function generateWBS(tasks: Task[], prefix: string = '', startIndex: number = 0): Task[] {
  if (!Array.isArray(tasks)) return []

  return tasks.map((task, index) => {
    const wbsNumber = startIndex + index + 1
    const currentWBS = prefix ? `${prefix}.${wbsNumber}` : `${wbsNumber}`

    const updatedTask: Task = {
      ...task,
      wbs: currentWBS
    }

    if (task.children && Array.isArray(task.children) && task.children.length > 0) {
      updatedTask.children = generateWBS(task.children, currentWBS, 0)
    }

    return updatedTask
  })
}

export function flattenTasks(tasks: Task[]): Task[] {
  if (!Array.isArray(tasks)) return []

  const result: Task[] = []

  function flatten(list: Task[]) {
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

export function findTask(tasks: Task[], taskId: string): Task | null {
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

export function findParentTask(tasks: Task[], taskId: string): Task | null {
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

export function buildTaskTree(flatTasks: Task[]): Task[] {
  if (!Array.isArray(flatTasks)) return []

  const taskMap = new Map<string, Task>()
  const rootTasks: Task[] = []

  flatTasks.forEach(task => {
    taskMap.set(task.id, { ...task, children: [] })
  })

  taskMap.forEach(task => {
    if (task.parentId && taskMap.has(task.parentId)) {
      const parent = taskMap.get(task.parentId)!
      parent.children.push(task)
    } else {
      rootTasks.push(task)
    }
  })

  return rootTasks
}

export function sortTasksByWBS(tasks: Task[]): Task[] {
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

export function getTaskDepth(task: Task, allTasks: Task[]): number {
  let depth = 0
  let currentTask: Task | null = task

  while (currentTask && currentTask.parentId) {
    depth++
    currentTask = findTask(allTasks, currentTask.parentId)
  }

  return depth
}

export function isTaskDescendant(potentialDescendant: Task, ancestor: Task): boolean {
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

export function getSiblingTasks(task: Task, allTasks: Task[]): Task[] {
  if (!task.parentId) {
    return allTasks.filter(t => !t.parentId)
  }

  const parent = findTask(allTasks, task.parentId)
  return parent && parent.children ? parent.children : []
}

export function reorderTask(tasks: Task[], taskId: string, newIndex: number): Task[] {
  const siblings = getSiblingTasks(findTask(tasks, taskId)!, tasks)
  const currentIndex = siblings.findIndex(t => t.id === taskId)

  if (currentIndex === newIndex || currentIndex === -1) {
    return tasks
  }

  const [movedTask] = siblings.splice(currentIndex, 1)
  siblings.splice(newIndex, 0, movedTask)

  return tasks
}
