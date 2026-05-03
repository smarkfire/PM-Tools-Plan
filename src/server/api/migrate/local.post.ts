import { eq } from 'drizzle-orm'
import { projects, tasks, members } from '~/server/db/schema'
import { db } from '~/server/db'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId

  const body = await readBody(event)
  const { project, tasks: tasksData, displaySettings, colorScheme } = body

  if (!project || !project.name) {
    throw createError({ statusCode: 400, statusMessage: 'Project name is required' })
  }

  const [newProject] = await db.insert(projects).values({
    name: project.name,
    startDate: project.startDate || null,
    endDate: project.endDate || null,
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
    const idMapping = new Map()
    const taskRows = []

    function flattenTaskList(list, parentId = null) {
      for (const task of list) {
        const oldId = task.id
        taskRows.push({
          projectId,
          parentId,
          wbsCode: task.wbs || null,
          name: task.name || '',
          startDate: task.startDate || null,
          endDate: task.endDate || null,
          duration: task.duration || 1,
          deliverable: task.deliverable || null,
          assignee: task.assignee || null,
          priority: task.priority || 'medium',
          status: task.status || 'pending',
          isMilestone: task.isMilestone || false,
          description: task.description || null,
        })
        idMapping.set(oldId, taskRows.length - 1)
        if (task.children && task.children.length > 0) {
          flattenTaskList(task.children, oldId)
        }
      }
    }

    flattenTaskList(tasksData)

    const insertedTasks = await db.insert(tasks).values(taskRows).returning({ id: tasks.id })

    const updatePromises = []
    let idx = 0
    function updateParentIds(list) {
      for (const task of list) {
        if (task.children && task.children.length > 0) {
          for (const child of task.children) {
            const parentDbId = insertedTasks[idx].id
            const childIdx = idMapping.get(child.id)
            if (childIdx !== undefined && insertedTasks[childIdx]) {
              updatePromises.push(
                db.update(tasks)
                  .set({ parentId: parentDbId })
                  .where(eq(tasks.id, insertedTasks[childIdx].id))
              )
            }
          }
        }
        idx++
        if (task.children) updateParentIds(task.children)
      }
    }
    updateParentIds(tasksData)

    await Promise.all(updatePromises)
  }

  return {
    success: true,
    projectId,
    message: '数据迁移成功',
  }
})
