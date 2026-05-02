export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { tasks } = body

  if (!tasks || !Array.isArray(tasks)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid tasks format'
    })
  }

  const now = new Date()

  const delayed = tasks.filter((t: any) => {
    if (!t.endDate || t.status === '已完成') return false
    return new Date(t.endDate) < now
  }).map((t: any) => ({
    id: t.id,
    name: t.name,
    endDate: t.endDate,
    assignee: t.assignee || '未分配',
    overdueDays: Math.ceil((now.getTime() - new Date(t.endDate).getTime()) / (1000 * 60 * 60 * 24))
  }))

  const atRisk = tasks.filter((t: any) => {
    if (!t.endDate || t.status === '已完成') return false
    const endDate = new Date(t.endDate)
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysRemaining > 0 && daysRemaining <= 3
  }).map((t: any) => ({
    id: t.id,
    name: t.name,
    endDate: t.endDate,
    assignee: t.assignee || '未分配',
    daysRemaining: Math.ceil((new Date(t.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }))

  return { delayed, atRisk }
})
