import * as XLSX from 'xlsx'
import { flattenTasks } from './wbs'
import { getCurrentLocale } from '@/locales'
import enTranslations from '@/locales/en.json'
import zhCNTranslations from '@/locales/zh-CN.json'

/**
 * Get translation for a key path
 * @param {String} key - Dot-separated key path (e.g., 'common.buttons.save')
 * @param {Object} params - Parameters for interpolation
 * @returns {String} Translated text
 */
function t(key, params = {}) {
  const locale = getCurrentLocale()
  const translations = locale === 'zh-CN' ? zhCNTranslations : enTranslations

  // Navigate through the key path
  const keys = key.split('.')
  let value = translations
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      // Key not found, return the key itself
      return key
    }
  }

  // If value is still an object, return the key
  if (typeof value === 'object') {
    return key
  }

  // Replace parameters if any
  if (params && typeof value === 'string') {
    return value.replace(/\{(\w+)\}/g, (match, param) => params[param] || match)
  }

  return value || key
}

/**
 * Get priority value in Chinese for compatibility
 * @param {String} priority - Priority value from task
 * @returns {String} Priority in current locale
 */
function getLocalizedPriority(priority) {
  const locale = getCurrentLocale()
  // Priority is stored in Chinese: 高/中/低
  if (locale === 'en') {
    const map = { '高': 'High', '中': 'Medium', '低': 'Low' }
    return map[priority] || priority
  }
  return priority
}

/**
 * Get status value in Chinese for compatibility
 * @param {String} status - Status value from task
 * @returns {String} Status in current locale
 */
function getLocalizedStatus(status) {
  const locale = getCurrentLocale()
  // Status is stored in Chinese: 待办/进行中/已完成
  if (locale === 'en') {
    const map = { '待办': 'To Do', '进行中': 'In Progress', '已完成': 'Completed' }
    return map[status] || status
  }
  return status
}

/**
 * Get member name by ID
 * @param {String} memberId - Member ID
 * @param {Array} members - Array of member objects
 * @returns {String} Member name
 */
function getMemberName(memberId, members = []) {
  const member = members.find(m => m.id === memberId)
  return member ? member.name : memberId || ''
}

/**
 * Export data to JSON file
 * @param {Object} data - Data to export
 * @param {String} filename - Name of the file (without extension)
 */
export function exportToJSON(data, filename = 'export') {
  try {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    downloadBlob(blob, `${filename}.json`)
    return true
  } catch (error) {
    console.error('Failed to export JSON:', error)
    return false
  }
}

/**
 * Export project data to Excel file
 * @param {Object} projectData - Project information
 * @param {Array} tasks - Task data
 * @param {String} filename - Name of the file (without extension)
 */
export function exportToExcel(projectData, tasks, filename = 'project-export') {
  try {
    const workbook = XLSX.utils.book_new()

    // Project info sheet
    const projectInfo = [
      [t('project.info.title'), ''],
      [t('project.info.form.name'), projectData.name || ''],
      [t('project.info.form.startDate'), projectData.startDate || ''],
      [t('project.info.form.endDate'), projectData.endDate || ''],
      [t('project.info.form.description'), projectData.description || ''],
      ['', ''],
      [t('project.members.title'), ''],
      [t('project.members.table.name'), t('project.members.table.phone'), t('project.members.table.email'), t('project.members.table.role')],
      ...(projectData.members || []).map(m => [m.name, m.phone, m.email, m.role])
    ]

    const projectSheet = XLSX.utils.aoa_to_sheet(projectInfo)
    XLSX.utils.book_append_sheet(workbook, projectSheet, t('project.info.title'))

    // Tasks sheet
    const flatTasks = flattenTasks(tasks)

    // Helper function to calculate task depth from WBS (number of dots)
    const getDepthFromWBS = (wbs) => {
      if (!wbs) return 0
      return (wbs.match(/\./g) || []).length
    }

    // Helper function to add indentation based on task depth
    const indentTaskName = (taskName, depth) => {
      // Use full-width spaces (　) for better Excel display
      // Each level indents by 2 full-width spaces
      const indentation = '　　'.repeat(depth)
      return indentation + (taskName || '')
    }

    const taskHeaders = [
      t('gantt.columns.wbs'),
      t('gantt.columns.name'),
      t('gantt.columns.startDate'),
      t('gantt.columns.endDate'),
      t('gantt.columns.duration'),
      t('gantt.columns.deliverable'),
      t('gantt.columns.dependencies'),
      t('gantt.columns.assignee'),
      t('gantt.columns.priority'),
      t('gantt.columns.status'),
      t('gantt.columns.description')
    ]
    const taskRows = flatTasks.map(task => {
      const depth = getDepthFromWBS(task.wbs)
      return [
        task.wbs || '',
        indentTaskName(task.name, depth),
        task.startDate || '',
        task.endDate || '',
        task.duration || 1,
        task.deliverable || '',
        (task.dependencies || []).join(', '),
        getMemberName(task.assignee, projectData.members),
        getLocalizedPriority(task.priority),
        getLocalizedStatus(task.status),
        task.description || ''
      ]
    })

    const tasksSheet = XLSX.utils.aoa_to_sheet([taskHeaders, ...taskRows])
    XLSX.utils.book_append_sheet(workbook, tasksSheet, t('tasks.plan.title'))

    // Write file
    XLSX.writeFile(workbook, `${filename}.xlsx`)
    return true
  } catch (error) {
    console.error('Failed to export Excel:', error)
    return false
  }
}

/**
 * Export tasks to Markdown format
 * @param {Object} projectData - Project information
 * @param {Array} tasks - Task data
 * @param {String} filename - Name of the file (without extension)
 */
export function exportToMarkdown(projectData, tasks, filename = 'project-export') {
  try {
    let markdown = `# ${projectData.name || t('tasks.plan.title')}\n\n`

    // Project info
    markdown += `## ${t('project.info.basicInfo')}\n\n`
    markdown += `- **${t('project.info.form.name')}**: ${projectData.name || ''}\n`
    markdown += `- **${t('project.info.form.startDate')}**: ${projectData.startDate || ''}\n`
    markdown += `- **${t('project.info.form.endDate')}**: ${projectData.endDate || ''}\n`
    markdown += `- **${t('project.info.form.description')}**: ${projectData.description || ''}\n\n`

    // Members
    if (projectData.members && projectData.members.length > 0) {
      markdown += `### ${t('project.members.title')}\n\n`
      markdown += `| ${t('project.members.table.name')} | ${t('project.members.table.phone')} | ${t('project.members.table.email')} | ${t('project.members.table.role')} |\n`
      markdown += `|------|------|------|------|\n`
      projectData.members.forEach(member => {
        markdown += `| ${member.name} | ${member.phone} | ${member.email} | ${member.role} |\n`
      })
      markdown += `\n`
    }

    // Tasks
    markdown += `## ${t('tasks.plan.title')}\n\n`

    function renderTaskList(taskList, level = 0) {
      let result = ''
      const indent = '  '.repeat(level)

      taskList.forEach(task => {
        const statusRaw = task.status
        const checkbox = statusRaw === '已完成' ? '[x]' : '[ ]'
        const status = statusRaw === '已完成' ? '✅' :
                       statusRaw === '进行中' ? '🔄' : '⏳'
        const priorityRaw = task.priority
        const priority = priorityRaw === '高' ? '🔴' :
                        priorityRaw === '中' ? '🟡' : '🟢'

        result += `${indent}- ${checkbox} ${status} **${task.name}** ${priority}\n`
        result += `${indent}  - WBS: ${task.wbs}\n`
        result += `${indent}  - ${t('gantt.columns.duration')}: ${task.startDate} ~ ${task.endDate} (${task.duration}${t('gantt.days')})\n`
        if (task.deliverable) {
          result += `${indent}  - ${t('gantt.columns.deliverable')}: ${task.deliverable}\n`
        }
        if (task.assignee) {
          result += `${indent}  - ${t('gantt.columns.assignee')}: ${getMemberName(task.assignee, projectData.members)}\n`
        }
        if (task.dependencies && task.dependencies.length > 0) {
          result += `${indent}  - ${t('gantt.columns.dependencies')}: ${task.dependencies.join(', ')}\n`
        }
        if (task.description) {
          result += `${indent}  - ${t('gantt.columns.description')}: ${task.description}\n`
        }
        result += `\n`

        // Render children
        if (task.children && task.children.length > 0) {
          result += renderTaskList(task.children, level + 1)
        }
      })

      return result
    }

    markdown += renderTaskList(tasks)

    // Create blob and download
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    downloadBlob(blob, `${filename}.md`)
    return true
  } catch (error) {
    console.error('Failed to export Markdown:', error)
    return false
  }
}

/**
 * Export Gantt chart as PNG image
 * @param {HTMLElement} ganttElement - The Gantt chart DOM element
 * @param {String} filename - Name of the file (without extension)
 */
export function exportGanttToPNG(ganttElement, filename = 'gantt-chart') {
  return new Promise((resolve, reject) => {
    try {
      // Use html2canvas if available, otherwise create a canvas from the element
      // For dhtmlx-gantt, we can use their built-in export or use html2canvas
      import('html2canvas').then(({ default: html2canvas }) => {
        html2canvas(ganttElement, {
          backgroundColor: '#ffffff',
          scale: 2, // Higher quality
          logging: false
        }).then(canvas => {
          canvas.toBlob(blob => {
            if (blob) {
              downloadBlob(blob, `${filename}.png`)
              resolve(true)
            } else {
              reject(new Error('Failed to create blob'))
            }
          }, 'image/png')
        }).catch(error => {
          reject(error)
        })
      }).catch(() => {
        // Fallback: try to use the element's toDataURL if available
        try {
          const canvas = ganttElement.querySelector('canvas')
          if (canvas) {
            const dataUrl = canvas.toDataURL('image/png')
            const link = document.createElement('a')
            link.href = dataUrl
            link.download = `${filename}.png`
            link.click()
            resolve(true)
          } else {
            reject(new Error('No canvas element found'))
          }
        } catch (error) {
          reject(error)
        }
      })
    } catch (error) {
      console.error('Failed to export Gantt as PNG:', error)
      reject(error)
    }
  })
}

/**
 * Download a blob as a file
 * @param {Blob} blob - Blob to download
 * @param {String} filename - Name of the file
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export full project data (project + tasks)
 * @param {Object} projectData - Project information
 * @param {Array} tasks - Task data
 * @param {String} format - Export format: 'json', 'excel', 'markdown'
 * @param {String} filename - Name of the file (without extension)
 */
export function exportProjectData(projectData, tasks, format = 'json', filename = 'project') {
  switch (format) {
    case 'json':
      return exportToJSON({ project: projectData, tasks }, filename)
    case 'excel':
      return exportToExcel(projectData, tasks, filename)
    case 'markdown':
      return exportToMarkdown(projectData, tasks, filename)
    default:
      console.error('Unsupported export format:', format)
      return false
  }
}

/**
 * Create a CSV string from tasks
 * @param {Array} tasks - Task data
 * @param {Array} members - Project members for assignee name lookup
 * @returns {String} CSV string
 */
export function tasksToCSV(tasks, members = []) {
  const flatTasks = flattenTasks(tasks)
  const headers = [
    t('gantt.columns.wbs'),
    t('gantt.columns.name'),
    t('gantt.columns.startDate'),
    t('gantt.columns.endDate'),
    t('gantt.columns.duration'),
    t('gantt.columns.deliverable'),
    t('gantt.columns.dependencies'),
    t('gantt.columns.assignee'),
    t('gantt.columns.priority'),
    t('gantt.columns.status'),
    t('gantt.columns.description')
  ]

  const rows = flatTasks.map(task => [
    task.wbs || '',
    task.name || '',
    task.startDate || '',
    task.endDate || '',
    task.duration || 1,
    task.deliverable || '',
    (task.dependencies || []).join(', '),
    getMemberName(task.assignee, members),
    getLocalizedPriority(task.priority),
    getLocalizedStatus(task.status),
    task.description || ''
  ])

  // Escape CSV values
  const escapeCSV = (value) => {
    const stringValue = String(value)
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n')

  return csvContent
}

/**
 * Export tasks as CSV file
 * @param {Array} tasks - Task data
 * @param {Array} members - Project members for assignee name lookup
 * @param {String} filename - Name of the file (without extension)
 */
export function exportToCSV(tasks, members = [], filename = 'tasks-export') {
  try {
    const csvContent = tasksToCSV(tasks, members)
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' }) // Add BOM for Excel
    downloadBlob(blob, `${filename}.csv`)
    return true
  } catch (error) {
    console.error('Failed to export CSV:', error)
    return false
  }
}
