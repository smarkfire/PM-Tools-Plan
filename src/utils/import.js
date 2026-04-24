import * as XLSX from 'xlsx'

/**
 * Read file as text
 * @param {File} file - File to read
 * @returns {Promise<String>} File content
 */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = (e) => reject(e)
    reader.readAsText(file)
  })
}

/**
 * Read file as ArrayBuffer
 * @param {File} file - File to read
 * @returns {Promise<ArrayBuffer>} File content
 */
export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = (e) => reject(e)
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Import project data from JSON file
 * @param {File} file - JSON file to import
 * @returns {Promise<Object>} Parsed project data
 */
export async function importFromJSON(file) {
  try {
    const content = await readFileAsText(file)
    const data = JSON.parse(content)

    // Validate structure
    if (!data.project && !data.tasks) {
      throw new Error('Invalid JSON format: missing project or tasks data')
    }

    return {
      project: data.project || null,
      tasks: data.tasks || [],
      success: true
    }
  } catch (error) {
    console.error('Failed to import JSON:', error)
    return {
      project: null,
      tasks: [],
      success: false,
      error: error.message
    }
  }
}

/**
 * Import project data from Excel file
 * @param {File} file - Excel file to import
 * @returns {Promise<Object>} Parsed project data
 */
export async function importFromExcel(file) {
  try {
    const buffer = await readFileAsArrayBuffer(file)
    const workbook = XLSX.read(buffer, { type: 'array' })

    let projectData = {
      id: '',
      name: '',
      startDate: '',
      endDate: '',
      description: '',
      members: []
    }
    let tasks = []

    // Read project info sheet
    const projectSheet = workbook.Sheets['项目信息']
    if (projectSheet) {
      const projectDataArray = XLSX.utils.sheet_to_json(projectSheet, { header: 1 })

      // Parse project basic info
      projectDataArray.forEach((row, index) => {
        if (row[0] === '项目名称') projectData.name = row[1] || ''
        if (row[0] === '开始日期') projectData.startDate = row[1] || ''
        if (row[0] === '结束日期') projectData.endDate = row[1] || ''
        if (row[0] === '备注') projectData.description = row[1] || ''
      })

      // Parse members (starts after '项目人员' row)
      let membersStarted = false
      let headersFound = false
      const members = []

      projectDataArray.forEach((row, index) => {
        if (row[0] === '项目人员') {
          membersStarted = true
          return
        }
        if (membersStarted && row[0] === '姓名' && row[1] === '电话') {
          headersFound = true
          return
        }
        if (headersFound && row[0] && row[0] !== '项目人员') {
          members.push({
            id: `imported-member-${Date.now()}-${members.length}`,
            name: row[0] || '',
            phone: row[1] || '',
            email: row[2] || '',
            role: row[3] || ''
          })
        }
      })

      projectData.members = members
    }

    // Read tasks sheet
    const tasksSheet = workbook.Sheets['项目计划']
    if (tasksSheet) {
      const tasksArray = XLSX.utils.sheet_to_json(tasksSheet, { header: 1 })

      if (tasksArray.length > 1) {
        const headers = tasksArray[0]
        const rows = tasksArray.slice(1)

        // Find column indices
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
          .filter(row => row[colIndex.name]) // Only include rows with task name
          .map((row, index) => {
            // Parse WBS to determine hierarchy
            const wbs = String(row[colIndex.wbs] || `${index + 1}`)
            const wbsParts = wbs.split('.')
            const level = wbsParts.length - 1

            return {
              id: `imported-task-${Date.now()}-${index}`,
              wbs: wbs,
              name: String(row[colIndex.name] || ''),
              startDate: formatDateFromExcel(row[colIndex.startDate]),
              endDate: formatDateFromExcel(row[colIndex.endDate]),
              duration: parseInt(row[colIndex.duration]) || 1,
              deliverable: String(row[colIndex.deliverable] || ''),
              dependencies: parseDependencies(row[colIndex.dependencies]),
              assignee: String(row[colIndex.assignee] || ''),
              priority: String(row[colIndex.priority] || '中'),
              status: String(row[colIndex.status] || '待办'),
              description: String(row[colIndex.description] || ''),
              parentId: null, // Will be set when building tree
              children: [],
              _importLevel: level // Temporary flag for building tree
            }
          })
      }
    }

    return {
      project: projectData,
      tasks: buildTaskTreeFromImport(tasks),
      success: true
    }
  } catch (error) {
    console.error('Failed to import Excel:', error)
    return {
      project: null,
      tasks: [],
      success: false,
      error: error.message
    }
  }
}

/**
 * Import project data from Markdown file
 * @param {File} file - Markdown file to import
 * @returns {Promise<Object>} Parsed project data
 */
export async function importFromMarkdown(file) {
  try {
    const content = await readFileAsText(file)
    const lines = content.split('\n')

    let projectData = {
      id: '',
      name: '',
      startDate: '',
      endDate: '',
      description: '',
      members: []
    }
    let tasks = []
    let currentSection = 'none'
    let memberHeadersFound = false

    lines.forEach(line => {
      const trimmed = line.trim()

      // Detect sections
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
        // Parse member table
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
        // Parse task
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
  } catch (error) {
    console.error('Failed to import Markdown:', error)
    return {
      project: null,
      tasks: [],
      success: false,
      error: error.message
    }
  }
}

/**
 * Parse a task from a Markdown line
 * @param {String} line - Markdown line
 * @returns {Object|null} Parsed task object
 */
function parseTaskFromMarkdown(line) {
  // This is a simplified parser - real implementation would be more robust
  const trimmed = line.trim()

  // Skip empty lines and non-task lines
  if (!trimmed.startsWith('-') && !trimmed.startsWith('*')) return null

  // Extract indent level
  const indentMatch = trimmed.match(/^(\s*)[-*]/)
  const level = indentMatch ? indentMatch[1].length / 2 : 0

  // Extract task name and other info
  const content = trimmed.replace(/^[\s\-*]+/, '').trim()

  // Simple task object
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

/**
 * Build task tree from imported flat tasks using _importLevel
 * @param {Array} flatTasks - Flat array of tasks with _importLevel
 * @returns {Array} Nested task tree
 */
function buildTaskTreeFromImport(flatTasks) {
  if (!Array.isArray(flatTasks) || flatTasks.length === 0) return []

  const result = []
  const stack = [{ level: -1, children: result }]

  flatTasks.forEach(task => {
    const { _importLevel, ...taskData } = task

    // Pop stack until we find the parent level
    while (stack.length > 0 && stack[stack.length - 1].level >= _importLevel) {
      stack.pop()
    }

    const parent = stack[stack.length - 1]
    const newTask = {
      ...taskData,
      parentId: parent.level >= 0 ? parent.task?.id : null,
      children: []
    }

    parent.children.push(newTask)
    stack.push({ level: _importLevel, task: newTask, children: newTask.children })
  })

  // Remove temporary empty children arrays if needed
  const cleanEmptyChildren = (tasks) => {
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

/**
 * Format date from Excel (which might be a number)
 * @param {any} dateValue - Date value from Excel
 * @returns {String} Formatted date string (YYYY-MM-DD)
 */
function formatDateFromExcel(dateValue) {
  if (!dateValue) return ''

  // If it's a number (Excel date serial)
  if (typeof dateValue === 'number') {
    const date = new Date((dateValue - 25569) * 86400 * 1000)
    return date.toISOString().split('T')[0]
  }

  // If it's already a string
  if (typeof dateValue === 'string') {
    // Try to parse various date formats
    const parsed = new Date(dateValue)
    if (!isNaN(parsed)) {
      return parsed.toISOString().split('T')[0]
    }
    return dateValue
  }

  return ''
}

/**
 * Parse dependencies from a string
 * @param {String} dependenciesString - Dependencies string (comma-separated)
 * @returns {Array} Array of dependency IDs
 */
function parseDependencies(dependenciesString) {
  if (!dependenciesString || typeof dependenciesString !== 'string') return []
  return dependenciesString
    .split(/[,，]/)
    .map(d => d.trim())
    .filter(d => d)
}

/**
 * Validate imported project data
 * @param {Object} data - Data to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateImportData(data) {
  const errors = []

  if (!data.project || typeof data.project !== 'object') {
    errors.push('项目信息格式不正确')
  }

  if (!data.tasks || !Array.isArray(data.tasks)) {
    errors.push('任务数据格式不正确')
  }

  // Validate task structure
  if (data.tasks) {
    data.tasks.forEach((task, index) => {
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

/**
 * Import data from file (auto-detect format)
 * @param {File} file - File to import
 * @returns {Promise<Object>} Imported and parsed data
 */
export async function importFromFile(file) {
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
