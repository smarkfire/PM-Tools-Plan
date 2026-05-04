import * as XLSX from 'xlsx'
import type { Project, Task, ImportResult, ValidationResult } from '~/types'

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = (e) => reject(e)
    reader.readAsText(file)
  })
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer)
    reader.onerror = (e) => reject(e)
    reader.readAsArrayBuffer(file)
  })
}

export async function importFromJSON(file: File): Promise<ImportResult> {
  try {
    const content = await readFileAsText(file)
    const data = JSON.parse(content)

    if (!data.project && !data.tasks) {
      throw new Error('Invalid JSON format: missing project or tasks data')
    }

    return {
      project: data.project || null,
      tasks: data.tasks || [],
      success: true
    }
  } catch (error: unknown) {
    console.error('Failed to import JSON:', error)
    return {
      project: null,
      tasks: [],
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

interface ImportedTask extends Partial<Task> {
  _importLevel: number
}

export async function importFromExcel(file: File): Promise<ImportResult> {
  try {
    const buffer = await readFileAsArrayBuffer(file)
    const workbook = XLSX.read(buffer, { type: 'array' })

    let projectData: Project = {
      id: '',
      name: '',
      startDate: '',
      endDate: '',
      description: '',
      members: []
    }
    let tasks: ImportedTask[] = []

    const projectSheet = workbook.Sheets['项目信息']
    if (projectSheet) {
      const projectDataArray = XLSX.utils.sheet_to_json<(string | number)[]>(projectSheet, { header: 1 })

      projectDataArray.forEach((row) => {
        const rowArr = row as unknown[]
        if (rowArr[0] === '项目名称') projectData.name = String(rowArr[1] || '')
        if (rowArr[0] === '开始日期') projectData.startDate = String(rowArr[1] || '')
        if (rowArr[0] === '结束日期') projectData.endDate = String(rowArr[1] || '')
        if (rowArr[0] === '备注') projectData.description = String(rowArr[1] || '')
      })

      let membersStarted = false
      let headersFound = false
      const members = projectData.members

      projectDataArray.forEach((row) => {
        const rowArr = row as unknown[]
        if (rowArr[0] === '项目人员') {
          membersStarted = true
          return
        }
        if (membersStarted && rowArr[0] === '姓名' && rowArr[1] === '电话') {
          headersFound = true
          return
        }
        if (headersFound && rowArr[0] && rowArr[0] !== '项目人员') {
          members.push({
            id: `imported-member-${Date.now()}-${members.length}`,
            name: String(rowArr[0] || ''),
            phone: String(rowArr[1] || ''),
            email: String(rowArr[2] || ''),
            role: String(rowArr[3] || '')
          })
        }
      })

      projectData.members = members
    }

    const tasksSheet = workbook.Sheets['项目计划']
    if (tasksSheet) {
      const tasksArray = XLSX.utils.sheet_to_json<(string | number)[]>(tasksSheet, { header: 1 })

      if (tasksArray.length > 1) {
        const headers = tasksArray[0] as unknown[]
        const rows = tasksArray.slice(1)

        const colIndex = {
          wbs: headers.indexOf('WBS'),
          name: headers.indexOf('任务名称'),
          startDate: headers.indexOf('开始日期'),
          endDate: headers.indexOf('结束日期'),
          duration: headers.indexOf('工期'),
          deliverable: headers.indexOf('交付物'),
          dependencies: headers.indexOf('依赖'),
          assignee: headers.indexOf('负责人'),
          priority: headers.indexOf('优先级'),
          status: headers.indexOf('状态'),
          description: headers.indexOf('备注')
        }

        tasks = rows
          .filter(row => {
            const rowArr = row as unknown[]
            return rowArr[colIndex.name]
          })
          .map((row, index) => {
            const rowArr = row as unknown[]
            const wbs = String(rowArr[colIndex.wbs] || `${index + 1}`)
            const wbsParts = wbs.split('.')
            const level = wbsParts.length - 1

            return {
              id: `imported-task-${Date.now()}-${index}`,
              wbs: wbs,
              name: String(rowArr[colIndex.name] || ''),
              startDate: formatDateFromExcel(rowArr[colIndex.startDate]),
              endDate: formatDateFromExcel(rowArr[colIndex.endDate]),
              duration: parseInt(String(rowArr[colIndex.duration])) || 1,
              deliverable: String(rowArr[colIndex.deliverable] || ''),
              dependencies: parseDependencies(String(rowArr[colIndex.dependencies] || '')),
              assignee: String(rowArr[colIndex.assignee] || ''),
              priority: String(rowArr[colIndex.priority] || '中'),
              status: String(rowArr[colIndex.status] || '待办'),
              description: String(rowArr[colIndex.description] || ''),
              parentId: null,
              children: [],
              _importLevel: level
            }
          })
      }
    }

    return {
      project: projectData,
      tasks: buildTaskTreeFromImport(tasks),
      success: true
    }
  } catch (error: unknown) {
    console.error('Failed to import Excel:', error)
    return {
      project: null,
      tasks: [],
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

export async function importFromMarkdown(file: File): Promise<ImportResult> {
  try {
    const content = await readFileAsText(file)
    const lines = content.split('\n')

    let projectData: Project = {
      id: '',
      name: '',
      startDate: '',
      endDate: '',
      description: '',
      members: []
    }
    let tasks: ImportedTask[] = []
    let currentSection = 'none'
    let memberHeadersFound = false

    lines.forEach(line => {
      const trimmed = line.trim()

      if (trimmed.startsWith('# ')) {
        projectData.name = trimmed.substring(2).trim()
        currentSection = 'project'
      } else if (trimmed.startsWith('## 项目信息')) {
        currentSection = 'project-info'
      } else if (trimmed.startsWith('### 项目人员')) {
        currentSection = 'members'
      } else if (trimmed.startsWith('## 项目计划')) {
        currentSection = 'tasks'
      } else if (trimmed.startsWith('|') && currentSection === 'members') {
        if (!memberHeadersFound) {
          memberHeadersFound = true
          return
        }
        const cells = trimmed.split('|').filter(c => c.trim() !== '')
        if (cells.length >= 4) {
          projectData.members.push({
            id: `imported-member-${Date.now()}-${projectData.members.length}`,
            name: cells[0].trim(),
            phone: cells[1].trim(),
            email: cells[2].trim(),
            role: cells[3].trim()
          })
        }
      } else if (trimmed.startsWith('-') && currentSection === 'tasks') {
        const task = parseTaskFromMarkdown(trimmed)
        if (task) {
          tasks.push(task)
        }
      }
    })

    return {
      project: projectData,
      tasks: buildTaskTreeFromImport(tasks),
      success: true
    }
  } catch (error: unknown) {
    console.error('Failed to import Markdown:', error)
    return {
      project: null,
      tasks: [],
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

function parseTaskFromMarkdown(line: string): ImportedTask | null {
  const trimmed = line.trim()

  if (!trimmed.startsWith('-') && !trimmed.startsWith('*')) return null

  const indentMatch = trimmed.match(/^(\s*)[-*]/)
  const level = indentMatch ? indentMatch[1].length / 2 : 0

  const content = trimmed.replace(/^[\s\-*]+/, '').trim()

  return {
    id: `imported-task-${Date.now()}-${Math.random()}`,
    wbs: '',
    name: content,
    startDate: '',
    endDate: '',
    duration: 1,
    deliverable: '',
    dependencies: [],
    assignee: '',
    priority: '中',
    status: '待办',
    description: '',
    parentId: null,
    children: [],
    _importLevel: level
  }
}

function buildTaskTreeFromImport(flatTasks: ImportedTask[]): Task[] {
  if (!Array.isArray(flatTasks) || flatTasks.length === 0) return []

  const result: Task[] = []
  const stack: { level: number; task?: Task; children: Task[] }[] = [{ level: -1, children: result }]

  flatTasks.forEach(task => {
    const { _importLevel, ...taskData } = task

    while (stack.length > 0 && stack[stack.length - 1].level >= _importLevel) {
      stack.pop()
    }

    const parent = stack[stack.length - 1]
    const newTask: Task = {
      id: taskData.id || '',
      wbs: taskData.wbs || '',
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
      parentId: parent.level >= 0 ? parent.task?.id || null : null,
      children: []
    }

    parent.children.push(newTask)
    stack.push({ level: _importLevel, task: newTask, children: newTask.children })
  })

  const cleanEmptyChildren = (tasks: Task[]) => {
    tasks.forEach(task => {
      if (task.children && task.children.length === 0) {
        delete task.children
      } else if (task.children) {
        cleanEmptyChildren(task.children)
      }
    })
  }

  cleanEmptyChildren(result)
  return result
}

function formatDateFromExcel(dateValue: unknown): string {
  if (!dateValue) return ''

  if (typeof dateValue === 'number') {
    const date = new Date((dateValue - 25569) * 86400 * 1000)
    return date.toISOString().split('T')[0]
  }

  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]
    }
    return dateValue
  }

  return ''
}

function parseDependencies(dependenciesString: string): string[] {
  if (!dependenciesString || typeof dependenciesString !== 'string') return []
  return dependenciesString
    .split(/[,，]/)
    .map(d => d.trim())
    .filter(d => d)
}

export function validateImportData(data: { project?: unknown; tasks?: unknown }): ValidationResult {
  const errors: string[] = []

  if (!data.project || typeof data.project !== 'object') {
    errors.push('项目信息格式不正确')
  }

  if (!data.tasks || !Array.isArray(data.tasks)) {
    errors.push('任务数据格式不正确')
  }

  if (data.tasks && Array.isArray(data.tasks)) {
    (data.tasks as Partial<Task>[]).forEach((task, index) => {
      if (!task.name) {
        errors.push(`任务 ${index + 1} 缺少名称`)
      }
      if (!task.startDate || !task.endDate) {
        errors.push(`任务 "${task.name}" 缺少日期信息`)
      }
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export async function importFromFile(file: File): Promise<ImportResult> {
  const filename = file.name.toLowerCase()

  if (filename.endsWith('.json')) {
    return await importFromJSON(file)
  } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
    return await importFromExcel(file)
  } else if (filename.endsWith('.md')) {
    return await importFromMarkdown(file)
  } else {
    return {
      project: null,
      tasks: [],
      success: false,
      error: '不支持的文件格式。请使用 JSON、Excel 或 Markdown 文件。'
    }
  }
}
