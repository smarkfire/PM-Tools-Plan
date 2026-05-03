import { projects, tasks, members } from '~/server/db/schema'
import { db } from '~/server/db'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId
  const body = await readBody(event)

  const { project: localProject, tasks: localTasks, members: localMembers } = body

  if (!localProject || !localProject.name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project data is required',
    })
  }

  const [newProject] = await db.insert(projects).values({
    ownerId: userId,
    name: localProject.name,
    description: localProject.description || null,
    startDate: localProject.startDate || null,
    endDate: localProject.endDate || null,
  }).returning()

  const taskIdMap = new Map<string, string>()

  if (Array.isArray(localTasks) && localTasks.length > 0) {
    const taskValues = localTasks.map((task: any, index: number) => {
      const newId = crypto.randomUUID()
      if (task.id) taskIdMap.set(task.id, newId)
      return {
        id: newId,
        projectId: newProject.id,
        parentId: task.parentId ? (taskIdMap.get(task.parentId) || null) : null,
        wbsCode: task.wbsCode || task.wbs_code || null,
        name: task.name,
        startDate: task.startDate || task.start_date || null,
        endDate: task.endDate || task.end_date || null,
        duration: task.duration || 1,
        deliverable: task.deliverable || null,
        assignee: task.assignee || null,
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        isMilestone: task.isMilestone || task.is_milestone || false,
        description: task.description || null,
        sortOrder: index,
      }
    })

    await db.insert(tasks).values(taskValues)
  }

  if (Array.isArray(localMembers) && localMembers.length > 0) {
    const memberValues = localMembers.map((member: any) => ({
      projectId: newProject.id,
      name: member.name,
      email: member.email || null,
      role: member.role || null,
      phone: member.phone || null,
    }))

    await db.insert(members).values(memberValues)
  }

  return {
    projectId: newProject.id,
    projectName: newProject.name,
    taskCount: localTasks?.length || 0,
    memberCount: localMembers?.length || 0,
  }
})
