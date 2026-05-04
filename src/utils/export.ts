import * as XLSX from 'xlsx'
import { flattenTasks } from './wbs'
import type { Project, Task, Member } from '~/types'

function getMemberName(memberId: string, members: Member[] = []): string {
  const member = members.find(m => m.id === memberId)
  return member ? member.name : memberId || ''
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportToJSON(data: Record<string, unknown>, filename: string = 'export'): boolean {
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

export function exportToExcel(projectData: Project, tasks: Task[], filename: string = 'project-export', translateFn?: (key: string) => string): boolean {
  try {
    const t = translateFn || ((key: string) => key)
    const workbook = XLSX.utils.book_new()

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

    const flatTasks = flattenTasks(tasks)

    const getDepthFromWBS = (wbs: string): number => {
      if (!wbs) return 0
      return (wbs.match(/\./g) || []).length
    }

    const indentTaskName = (taskName: string, depth: number): string => {
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
        task.priority || '',
        task.status || '',
        task.description || ''
      ]
    })

    const tasksSheet = XLSX.utils.aoa_to_sheet([taskHeaders, ...taskRows])
    XLSX.utils.book_append_sheet(workbook, tasksSheet, t('tasks.plan.title'))

    XLSX.writeFile(workbook, `${filename}.xlsx`)
    return true
  } catch (error) {
    console.error('Failed to export Excel:', error)
    return false
  }
}

export function exportToMarkdown(projectData: Project, tasks: Task[], filename: string = 'project-export', translateFn?: (key: string) => string): boolean {
  try {
    const t = translateFn || ((key: string) => key)
    let markdown = `# ${projectData.name || t('tasks.plan.title')}\n\n`

    markdown += `## ${t('project.info.basicInfo')}\n\n`
    markdown += `- **${t('project.info.form.name')}**: ${projectData.name || ''}\n`
    markdown += `- **${t('project.info.form.startDate')}**: ${projectData.startDate || ''}\n`
    markdown += `- **${t('project.info.form.endDate')}**: ${projectData.endDate || ''}\n`
    markdown += `- **${t('project.info.form.description')}**: ${projectData.description || ''}\n\n`

    if (projectData.members && projectData.members.length > 0) {
      markdown += `### ${t('project.members.title')}\n\n`
      markdown += `| ${t('project.members.table.name')} | ${t('project.members.table.phone')} | ${t('project.members.table.email')} | ${t('project.members.table.role')} |\n`
      markdown += `|------|------|------|------|\n`
      projectData.members.forEach(member => {
        markdown += `| ${member.name} | ${member.phone} | ${member.email} | ${member.role} |\n`
      })
      markdown += `\n`
    }

    markdown += `## ${t('tasks.plan.title')}\n\n`

    function renderTaskList(taskList: Task[], level: number = 0): string {
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

        if (task.children && task.children.length > 0) {
          result += renderTaskList(task.children, level + 1)
        }
      })

      return result
    }

    markdown += renderTaskList(tasks)

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    downloadBlob(blob, `${filename}.md`)
    return true
  } catch (error) {
    console.error('Failed to export Markdown:', error)
    return false
  }
}

export function exportGanttToPNG(ganttElement: HTMLElement, filename: string = 'gantt-chart'): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      import('html2canvas').then(({ default: html2canvas }) => {
        html2canvas(ganttElement, {
          backgroundColor: '#ffffff',
          scale: 2,
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
        }).catch((error: Error) => {
          reject(error)
        })
      }).catch(() => {
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

export function exportProjectData(projectData: Project, tasks: Task[], format: string = 'json', filename: string = 'project', translateFn?: (key: string) => string): boolean {
  switch (format) {
    case 'json':
      return exportToJSON({ project: projectData, tasks }, filename)
    case 'excel':
      return exportToExcel(projectData, tasks, filename, translateFn)
    case 'markdown':
      return exportToMarkdown(projectData, tasks, filename, translateFn)
    default:
      console.error('Unsupported export format:', format)
      return false
  }
}

export function tasksToCSV(tasks: Task[], members: Member[] = [], translateFn?: (key: string) => string): string {
  const t = translateFn || ((key: string) => key)
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
    task.priority || '',
    task.status || '',
    task.description || ''
  ])

  const escapeCSV = (value: unknown): string => {
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

export function exportToCSV(tasks: Task[], members: Member[] = [], filename: string = 'tasks-export', translateFn?: (key: string) => string): boolean {
  try {
    const csvContent = tasksToCSV(tasks, members, translateFn)
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
    downloadBlob(blob, `${filename}.csv`)
    return true
  } catch (error) {
    console.error('Failed to export CSV:', error)
    return false
  }
}
