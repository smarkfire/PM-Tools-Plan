export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { project, tasks } = body

  if (!tasks || !Array.isArray(tasks)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid tasks format'
    })
  }

  const now = new Date()

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t: any) => t.status === '已完成').length
  const progress = totalTasks > 0 ? completedTasks / totalTasks * 100 : 100

  let progressScore = 100
  if (project?.startDate && project?.endDate) {
    const startDate = new Date(project.startDate)
    const endDate = new Date(project.endDate)
    const totalDuration = endDate.getTime() - startDate.getTime()
    const elapsed = now.getTime() - startDate.getTime()
    if (totalDuration > 0) {
      const expectedProgress = Math.min(elapsed / totalDuration * 100, 100)
      progressScore = progress >= expectedProgress ? 100 : Math.max(0, 100 - (expectedProgress - progress) * 2)
    }
  }
  progressScore = Math.round(progressScore)

  const assigneeCounts = new Map<string, number>()
  tasks.forEach((t: any) => {
    if (t.assignee) {
      assigneeCounts.set(t.assignee, (assigneeCounts.get(t.assignee) || 0) + 1)
    }
  })
  let resourceScore = 100
  if (assigneeCounts.size > 0) {
    const counts = Array.from(assigneeCounts.values())
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length
    const variance = counts.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) / counts.length
    resourceScore = Math.round(Math.max(0, 100 - variance * 5))
  }

  let riskCount = 0
  tasks.forEach((task: any) => {
    if (!task.endDate || task.status === '已完成') return
    const endDate = new Date(task.endDate)
    if (endDate < now) {
      riskCount += 10
    } else {
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysRemaining <= 3) {
        riskCount += 5
      }
    }
  })
  const riskScore = Math.max(0, 100 - riskCount)

  let hasCyclicDependency = false
  let orphanTaskCount = 0
  const taskIds = new Set(tasks.map((t: any) => t.id))

  tasks.forEach((task: any) => {
    if (task.dependencies && Array.isArray(task.dependencies) && task.dependencies.length > 0) {
      task.dependencies.forEach((depId: string) => {
        if (taskIds.has(depId)) {
          const depTask = tasks.find((t: any) => t.id === depId)
          if (depTask?.dependencies?.includes(task.id)) {
            hasCyclicDependency = true
          }
        }
      })
    } else {
      orphanTaskCount++
    }
  })

  let dependencyScore = 100
  if (hasCyclicDependency) dependencyScore -= 30
  if (orphanTaskCount > tasks.length * 0.3) dependencyScore -= 20
  dependencyScore = Math.max(0, dependencyScore)

  const overallScore = Math.round((progressScore + resourceScore + riskScore + dependencyScore) / 4)

  const getScoreStatus = (score: number) => {
    if (score >= 90) return '优秀'
    if (score >= 75) return '良好'
    if (score >= 60) return '正常'
    return '需关注'
  }

  const recommendations: string[] = []
  if (progressScore < 70) {
    recommendations.push('项目进度落后于预期，建议增加资源或调整工期')
  }
  if (resourceScore < 70) {
    recommendations.push('团队成员负载不均衡，建议重新分配任务')
  }
  if (riskScore < 70) {
    const delayedCount = tasks.filter((t: any) => {
      if (!t.endDate || t.status === '已完成') return false
      return new Date(t.endDate) < now
    }).length
    if (delayedCount > 0) {
      recommendations.push(`有${delayedCount}个任务已延期，建议优先处理`)
    }
  }
  if (dependencyScore < 70) {
    if (hasCyclicDependency) {
      recommendations.push('存在循环依赖，建议优化任务依赖关系')
    }
    if (orphanTaskCount > tasks.length * 0.3) {
      recommendations.push('过多任务缺少依赖关系，建议梳理任务间关联')
    }
  }
  if (recommendations.length === 0) {
    recommendations.push('项目状态良好，继续保持当前节奏')
  }

  return {
    overallScore,
    dimensions: {
      progress: { score: progressScore, status: getScoreStatus(progressScore) },
      resources: { score: resourceScore, status: getScoreStatus(resourceScore) },
      risks: { score: riskScore, status: getScoreStatus(riskScore) },
      dependencies: { score: dependencyScore, status: getScoreStatus(dependencyScore) }
    },
    recommendations,
    statistics: {
      totalTasks,
      completedTasks,
      progress: Math.round(progress)
    }
  }
})
