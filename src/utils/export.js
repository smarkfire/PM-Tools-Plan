import * as XLSX from 'xlsx'
import { flattenTasks } from './wbs'

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
      ['项目信息', ''],
      ['项目名称', projectData.name || ''],
      ['开始日期', projectData.startDate || ''],
      ['结束日期', projectData.endDate || ''],
      ['备注', projectData.description || ''],
      ['', ''],
      ['项目人员', ''],
      ['姓名', '电话', '邮箱', '角色'],
      ...(projectData.members || []).map(m => [m.name, m.phone, m.email, m.role])
    ]

    const projectSheet = XLSX.utils.aoa_to_sheet(projectInfo)
    XLSX.utils.book_append_sheet(workbook, projectSheet, '项目信息')

    // Tasks sheet
    const flatTasks = flattenTasks(tasks)
    const taskHeaders = ['WBS', '任务名称', '开始日期', '结束日期', '工期', '交付物', '依赖', '负责人', '优先级', '状态', '备注']
    const taskRows = flatTasks.map(task => [
      task.wbs || '',
      task.name || '',
      task.startDate || '',
      task.endDate || '',
      task.duration || 1,
      task.deliverable || '',
      (task.dependencies || []).join(', '),
      task.assignee || '',
      task.priority || '',
      task.status || '',
      task.description || ''
    ])

    const tasksSheet = XLSX.utils.aoa_to_sheet([taskHeaders, ...taskRows])
    XLSX.utils.book_append_sheet(workbook, tasksSheet, '项目计划')

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
    let markdown = `# ${projectData.name || '项目计划'}\n\n`

    // Project info
    markdown += `## 项目信息\n\n`
    markdown += `- **项目名称**: ${projectData.name || ''}\n`
    markdown += `- **开始日期**: ${projectData.startDate || ''}\n`
    markdown += `- **结束日期**: ${projectData.endDate || ''}\n`
    markdown += `- **备注**: ${projectData.description || ''}\n\n`

    // Members
    if (projectData.members && projectData.members.length > 0) {
      markdown += `### 项目人员\n\n`
      markdown += `| 姓名 | 电话 | 邮箱 | 角色 |\n`
      markdown += `|------|------|------|------|\n`
      projectData.members.forEach(member => {
        markdown += `| ${member.name} | ${member.phone} | ${member.email} | ${member.role} |\n`
      })
      markdown += `\n`
    }

    // Tasks
    markdown += `## 项目计划\n\n`

    function renderTaskList(taskList, level = 0) {
      let result = ''
      const indent = '  '.repeat(level)

      taskList.forEach(task => {
        const checkbox = task.status === '已完成' ? '[x]' : '[ ]'
        const status = task.status === '已完成' ? '✅' :
                       task.status === '进行中' ? '🔄' : '⏳'
        const priority = task.priority === '高' ? '🔴' :
                        task.priority === '中' ? '🟡' : '🟢'

        result += `${indent}- ${checkbox} ${status} **${task.name}** ${priority}\n`
        result += `${indent}  - WBS: ${task.wbs}\n`
        result += `${indent}  - 时间: ${task.startDate} ~ ${task.endDate} (${task.duration}天)\n`
        if (task.deliverable) {
          result += `${indent}  - 交付物: ${task.deliverable}\n`
        }
        if (task.assignee) {
          result += `${indent}  - 负责人: ${task.assignee}\n`
        }
        if (task.dependencies && task.dependencies.length > 0) {
          result += `${indent}  - 依赖: ${task.dependencies.join(', ')}\n`
        }
        if (task.description) {
          result += `${indent}  - 备注: ${task.description}\n`
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
 * @returns {String} CSV string
 */
export function tasksToCSV(tasks) {
  const flatTasks = flattenTasks(tasks)
  const headers = ['WBS', '任务名称', '开始日期', '结束日期', '工期', '交付物', '依赖', '负责人', '优先级', '状态', '备注']

  const rows = flatTasks.map(task => [
    task.wbs || '',
    task.name || '',
    task.startDate || '',
    task.endDate || '',
    task.duration || 1,
    task.deliverable || '',
    (task.dependencies || []).join(', '),
    task.assignee || '',
    task.priority || '',
    task.status || '',
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
 * @param {String} filename - Name of the file (without extension)
 */
export function exportToCSV(tasks, filename = 'tasks-export') {
  try {
    const csvContent = tasksToCSV(tasks)
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' }) // Add BOM for Excel
    downloadBlob(blob, `${filename}.csv`)
    return true
  } catch (error) {
    console.error('Failed to export CSV:', error)
    return false
  }
}
