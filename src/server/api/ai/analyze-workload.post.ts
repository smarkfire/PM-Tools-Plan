export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { tasks, members } = body

  if (!tasks || !Array.isArray(tasks)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid tasks format'
    })
  }

  const memberList = members || []
  const workload = memberList.map((member: any) => {
    const memberTasks = tasks.filter((t: any) =>
      t.assignee === member.name && t.status !== '已完成'
    )

    const totalHours = memberTasks.reduce((sum: number, t: any) => {
      return sum + (t.duration || 0) * 8
    }, 0)

    return {
      memberId: member.id,
      memberName: member.name,
      memberRole: member.role || '',
      taskCount: memberTasks.length,
      totalHours,
      loadPercentage: Math.min(totalHours / 40 * 100, 100),
      status: totalHours > 50 ? '过载' : totalHours > 30 ? '正常' : '空闲',
      tasks: memberTasks.map((t: any) => ({
        id: t.id,
        name: t.name,
        duration: t.duration,
        priority: t.priority,
        status: t.status
      }))
    }
  })

  const unassignedTasks = tasks.filter((t: any) =>
    !t.assignee && t.status !== '已完成'
  )

  return { workload, unassignedCount: unassignedTasks.length }
})
