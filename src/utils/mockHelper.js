/**
 * Mock data helper for easy loading in browser console
 * Usage in browser console:
 * 1. Load mock data: loadMockData()
 * 2. Load enhanced mock data: loadEnhancedMockData()
 * 3. Clear all data: clearAllData()
 */

import { initMockData, clearMockData } from '~/data/mock'
import { initMockData as initEnhancedMockData, getTaskStatistics } from '~/data/mock-enhanced'
import { useProjectStore } from '~/store/project'
import { useTasksStore } from '~/store/tasks'

/**
 * Load mock data and update stores
 */
export function loadMockData() {
  if (initMockData()) {
    // Reload stores from localStorage
    const projectStore = useProjectStore()
    const tasksStore = useTasksStore()

    projectStore.loadFromLocalStorage()
    tasksStore.loadFromLocalStorage()

    console.log('✅ Mock data loaded successfully!')
    console.log('Project:', projectStore.project)
    console.log('Tasks:', tasksStore.tasks.length, 'tasks loaded')
    return true
  } else {
    console.error('❌ Failed to load mock data')
    return false
  }
}

/**
 * Load enhanced mock data with 30 tasks across 5 levels
 */
export function loadEnhancedMockData() {
  if (initEnhancedMockData()) {
    // Reload stores from localStorage
    const projectStore = useProjectStore()
    const tasksStore = useTasksStore()

    projectStore.loadFromLocalStorage()
    tasksStore.loadFromLocalStorage()

    console.log('✅ Enhanced mock data loaded successfully!')
    console.log('Project:', projectStore.project.name)

    const stats = getTaskStatistics()
    console.log('📊 Task Statistics:')
    console.log(`   Total Tasks: ${stats.total}`)
    console.log(`   Level 1: ${stats.byLevel.level1}`)
    console.log(`   Level 2: ${stats.byLevel.level2}`)
    console.log(`   Level 3: ${stats.byLevel.level3}`)
    console.log(`   Level 4: ${stats.byLevel.level4}`)
    console.log(`   Level 5: ${stats.byLevel.level5}`)
    console.log(`   Completed: ${stats.byStatus.completed}`)
    console.log(`   In Progress: ${stats.byStatus.inProgress}`)
    console.log(`   Todo: ${stats.byStatus.todo}`)

    return true
  } else {
    console.error('❌ Failed to load enhanced mock data')
    return false
  }
}

/**
 * Clear all data
 */
export function clearAllData() {
  if (clearMockData()) {
    // Clear stores
    const projectStore = useProjectStore()
    const tasksStore = useTasksStore()

    projectStore.clearProject()
    tasksStore.clearTasks()

    console.log('✅ All data cleared!')
    return true
  } else {
    console.error('❌ Failed to clear data')
    return false
  }
}

/**
 * Get current data statistics
 */
export function getDataStats() {
  const projectStore = useProjectStore()
  const tasksStore = useTasksStore()

  return {
    project: {
      name: projectStore.project.name,
      membersCount: projectStore.project.members.length,
      hasData: projectStore.hasProject
    },
    tasks: {
      total: tasksStore.flatTaskList.length,
      root: tasksStore.rootTasks.length,
      completed: tasksStore.flatTaskList.filter(t => t.status === '已完成').length,
      inProgress: tasksStore.flatTaskList.filter(t => t.status === '进行中').length,
      todo: tasksStore.flatTaskList.filter(t => t.status === '待办').length
    }
  }
}

// Make functions available globally for console access
if (typeof window !== 'undefined') {
  window.loadMockData = loadMockData
  window.loadEnhancedMockData = loadEnhancedMockData
  window.clearAllData = clearAllData
  window.getDataStats = getDataStats

  console.log('📦 Mock data helpers loaded!')
  console.log('Available commands:')
  console.log('  loadMockData()         - Load example project data (18 tasks)')
  console.log('  loadEnhancedMockData() - Load enhanced data (30 tasks, 5 levels)')
  console.log('  clearAllData()         - Clear all data')
  console.log('  getDataStats()         - Show current data statistics')
}
