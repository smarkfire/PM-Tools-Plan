import { projects, tasks, members } from '~/server/db/schema'
import { db } from '~/server/db'

function sanitizeDate(val) {
  if (!val || val === '' || val === 'null' || val === 'undefined') return null
  return val
}

function sanitizeString(val, maxLen = 200) {
  if (!val || val === 'null' || val === 'undefined') return null
  return String(val).slice(0, maxLen)
}

export default defineEventHandler(async (event) => {
  const userId = event.context.userId

  const body = await readBody(event)
  const { project, tasks: tasksData, displaySettings, colorScheme } = body

  if (!project || !project.name) {
    throw createError({ statusCode: 400, statusMessage: 'Project name is required' })
  }

  const [newProject] = await db.insert(projects).values({
    name: project.name,
    startDate: sanitizeDate(project.startDate),
    endDate: sanitizeDate(project.endDate),
    description: project.description || '',
    ownerId: userId,
  }).returning({ id: projects.id })

  const projectId = newProject.id

  if (project.members && project.members.length > 0) {
    await db.insert(members).values(
      project.members.map((m) => ({
        projectId,
        name: m.name || '',
        email: m.email || null,
        role: m.role || null,
        phone: m.phone || null,
      }))
    )
  }

  if (tasksData && tasksData.length > 0) {
    const taskIdMap = new Map<string, string>()

    function flattenTaskList(list: any[], parentId: string | null = null): any[] {
      const rows: any[] = []
      for (const task of list) {
        const newId = crypto.randomUUID()
        if (task.id) taskIdMap.set(task.id, newId)

        rows.push({
          id: newId,
          projectId,
          parentId,
          wbsCode: sanitizeString(task.wbs || task.wbsCode, 20),
          name: task.name || '',
          startDate: sanitizeDate(task.startDate),
          endDate: sanitizeDate(task.endDate),
          duration: task.duration || 1,
          deliverable: sanitizeString(task.deliverable),
          assignee: sanitizeString(task.assignee, 100),
          priority: sanitizeString(task.priority, 20) || 'medium',
          status: sanitizeString(task.status, 20) || 'pending',
          isMilestone: task.isMilestone || false,
          description: sanitizeString(task.description),
        })

        if (task.children && task.children.length > 0) {
          rows.push(...flattenTaskList(task.children, newId))
        }
      }
      return rows
    }

    const taskRows = flattenTaskList(tasksData)
    await db.insert(tasks).values(taskRows)
  }

  return {
    success: true,
    projectId,
    message: '数据迁移成功',
  }
})
