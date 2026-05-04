import type { Project, Task } from '~/types'

export const mockProject: Project = {
  id: 'mock-project-enhanced',
  name: '智慧城市综合管理平台开发项目',
  startDate: '2026-04-20',
  endDate: '2026-12-31',
  description: '本项目旨在开发一个集成的智慧城市综合管理平台，包含交通管理、环境监测、公共安全、应急指挥和城市服务五大核心模块，通过大数据分析和人工智能技术，实现城市运行的智能化管理和决策支持。',
  members: [
    { id: 'm1', name: '张明', phone: '13800138001', email: 'zhangming@example.com', role: '项目总监' },
    { id: 'm2', name: '李华', phone: '13800138002', email: 'lihua@example.com', role: '技术总监' },
    { id: 'm3', name: '王芳', phone: '13800138003', email: 'wangfang@example.com', role: '产品经理' },
    { id: 'm4', name: '赵强', phone: '13800138004', email: 'zhaoqiang@example.com', role: '架构师' },
    { id: 'm5', name: '刘洋', phone: '13800138005', email: 'liuyang@example.com', role: '前端负责人' },
    { id: 'm6', name: '陈静', phone: '13800138006', email: 'chenjing@example.com', role: '后端负责人' },
    { id: 'm7', name: '杨光', phone: '13800138007', email: 'yangguang@example.com', role: '测试负责人' },
    { id: 'm8', name: '周娜', phone: '13800138008', email: 'zhouna@example.com', role: 'UI设计师' },
    { id: 'm9', name: '吴伟', phone: '13800138009', email: 'wuwei@example.com', role: 'DevOps工程师' },
    { id: 'm10', name: '郑丽', phone: '13800138010', email: 'zhengli@example.com', role: '数据分析师' }
  ]
}

export const mockTasks: Task[] = [
  {
    id: 't1', wbs: '1', name: '项目启动阶段', startDate: '2026-04-20', endDate: '2026-05-10', duration: 21, deliverable: '项目启动文档', dependencies: [], assignee: 'm1', priority: '高', status: '已完成', description: '完成项目立项、团队组建、需求调研和项目规划工作', parentId: null,
    children: [
      {
        id: 't1-1', wbs: '1.1', name: '项目立项', startDate: '2026-04-20', endDate: '2026-04-30', duration: 11, deliverable: '项目章程', dependencies: [], assignee: 'm1', priority: '高', status: '已完成', description: '完成项目立项审批和项目章程编写', parentId: 't1',
        children: [
          {
            id: 't1-1-1', wbs: '1.1.1', name: '项目可行性分析', startDate: '2026-04-20', endDate: '2026-04-25', duration: 6, deliverable: '可行性分析报告', dependencies: [], assignee: 'm3', priority: '高', status: '已完成', description: '完成项目技术可行性、经济可行性和操作可行性分析', parentId: 't1-1',
            children: [
              {
                id: 't1-1-1-1', wbs: '1.1.1.1', name: '技术可行性调研', startDate: '2026-04-20', endDate: '2026-04-23', duration: 4, deliverable: '技术调研报告', dependencies: [], assignee: 'm2', priority: '高', status: '已完成', description: '调研现有技术方案和工具选型', parentId: 't1-1-1',
                children: [
                  { id: 't1-1-1-1-1', wbs: '1.1.1.1.1', name: '前端技术栈选型', startDate: '2026-04-20', endDate: '2026-04-21', duration: 2, deliverable: '技术选型方案', dependencies: [], assignee: 'm4', priority: '中', status: '已完成', description: '评估Vue、React等前端框架', parentId: 't1-1-1-1', children: [] }
                ]
              },
              { id: 't1-1-1-2', wbs: '1.1.1.2', name: '成本效益分析', startDate: '2026-04-24', endDate: '2026-04-25', duration: 2, deliverable: '成本分析报告', dependencies: ['t1-1-1-1'], assignee: 'm10', priority: '中', status: '已完成', description: '完成项目成本预算和收益预测分析', parentId: 't1-1-1', children: [] }
            ]
          },
          { id: 't1-1-2', wbs: '1.1.2', name: '项目章程编写', startDate: '2026-04-26', endDate: '2026-04-30', duration: 5, deliverable: '项目章程文档', dependencies: ['t1-1-1'], assignee: 'm1', priority: '高', status: '已完成', description: '编写项目章程、明确项目目标和范围', parentId: 't1-1', children: [] }
        ]
      },
      {
        id: 't1-2', wbs: '1.2', name: '团队组建', startDate: '2026-05-01', endDate: '2026-05-10', duration: 10, deliverable: '团队组织架构', dependencies: ['t1-1'], assignee: 'm1', priority: '高', status: '已完成', description: '完成项目团队组建和角色分配', parentId: 't1',
        children: [
          { id: 't1-2-1', wbs: '1.2.1', name: '核心团队招聘', startDate: '2026-05-01', endDate: '2026-05-08', duration: 8, deliverable: '人员配置表', dependencies: [], assignee: 'm1', priority: '高', status: '已完成', description: '招聘项目经理、技术负责人等核心岗位', parentId: 't1-2', children: [] },
          { id: 't1-2-2', wbs: '1.2.2', name: '团队培训', startDate: '2026-05-06', endDate: '2026-05-10', duration: 5, deliverable: '培训记录', dependencies: ['t1-2-1'], assignee: 'm2', priority: '中', status: '已完成', description: '开展技术培训和流程培训', parentId: 't1-2', children: [] }
        ]
      }
    ]
  },
  {
    id: 't2', wbs: '2', name: '需求分析阶段', startDate: '2026-05-11', endDate: '2026-06-15', duration: 36, deliverable: '需求规格说明书', dependencies: ['t1'], assignee: 'm3', priority: '高', status: '已完成', description: '完成系统需求分析、用户调研和需求规格说明', parentId: null,
    children: [
      {
        id: 't2-1', wbs: '2.1', name: '用户需求调研', startDate: '2026-05-11', endDate: '2026-05-25', duration: 15, deliverable: '用户调研报告', dependencies: [], assignee: 'm3', priority: '高', status: '已完成', description: '开展用户访谈和问卷调查', parentId: 't2',
        children: [
          { id: 't2-1-1', wbs: '2.1.1', name: '政府部门访谈', startDate: '2026-05-11', endDate: '2026-05-18', duration: 8, deliverable: '访谈记录', dependencies: [], assignee: 'm3', priority: '高', status: '已完成', description: '访谈城管、交通、环保等政府部门', parentId: 't2-1', children: [] },
          { id: 't2-1-2', wbs: '2.1.2', name: '市民问卷调查', startDate: '2026-05-19', endDate: '2026-05-25', duration: 7, deliverable: '调查报告', dependencies: ['t2-1-1'], assignee: 'm10', priority: '中', status: '已完成', description: '开展市民需求问卷调查并统计分析', parentId: 't2-1', children: [] }
        ]
      },
      {
        id: 't2-2', wbs: '2.2', name: '功能需求分析', startDate: '2026-05-26', endDate: '2026-06-10', duration: 16, deliverable: '功能需求文档', dependencies: ['t2-1'], assignee: 'm3', priority: '高', status: '已完成', description: '分析并整理系统功能需求', parentId: 't2',
        children: [
          { id: 't2-2-1', wbs: '2.2.1', name: '核心功能定义', startDate: '2026-05-26', endDate: '2026-06-05', duration: 11, deliverable: '功能清单', dependencies: [], assignee: 'm3', priority: '高', status: '已完成', description: '定义系统核心功能模块和业务流程', parentId: 't2-2', children: [] },
          { id: 't2-2-2', wbs: '2.2.2', name: '非功能需求分析', startDate: '2026-06-01', endDate: '2026-06-10', duration: 10, deliverable: '非功能需求规格', dependencies: ['t2-2-1'], assignee: 'm4', priority: '中', status: '已完成', description: '分析性能、安全、可维护性等非功能需求', parentId: 't2-2', children: [] }
        ]
      }
    ]
  },
  {
    id: 't3', wbs: '3', name: '系统设计阶段', startDate: '2026-06-16', endDate: '2026-08-15', duration: 61, deliverable: '系统设计文档', dependencies: ['t2'], assignee: 'm4', priority: '高', status: '已完成', description: '完成系统架构设计、数据库设计和接口设计', parentId: null,
    children: [
      {
        id: 't3-1', wbs: '3.1', name: '架构设计', startDate: '2026-06-16', endDate: '2026-07-15', duration: 30, deliverable: '架构设计文档', dependencies: [], assignee: 'm4', priority: '高', status: '已完成', description: '完成系统整体架构设计', parentId: 't3',
        children: [
          { id: 't3-1-1', wbs: '3.1.1', name: '技术架构设计', startDate: '2026-06-16', endDate: '2026-07-05', duration: 20, deliverable: '技术架构图', dependencies: [], assignee: 'm4', priority: '高', status: '已完成', description: '设计系统技术架构和部署方案', parentId: 't3-1', children: [] },
          { id: 't3-1-2', wbs: '3.1.2', name: '安全架构设计', startDate: '2026-07-01', endDate: '2026-07-15', duration: 15, deliverable: '安全设计方案', dependencies: ['t3-1-1'], assignee: 'm2', priority: '高', status: '已完成', description: '设计系统安全架构和权限控制方案', parentId: 't3-1', children: [] }
        ]
      },
      {
        id: 't3-2', wbs: '3.2', name: 'UI设计', startDate: '2026-06-20', endDate: '2026-07-31', duration: 42, deliverable: 'UI设计稿', dependencies: [], assignee: 'm8', priority: '中', status: '已完成', description: '完成系统界面设计和交互设计', parentId: 't3',
        children: [
          { id: 't3-2-1', wbs: '3.2.1', name: '界面原型设计', startDate: '2026-06-20', endDate: '2026-07-15', duration: 26, deliverable: '原型图', dependencies: [], assignee: 'm8', priority: '中', status: '已完成', description: '设计系统界面原型', parentId: 't3-2', children: [] },
          { id: 't3-2-2', wbs: '3.2.2', name: '视觉设计', startDate: '2026-07-10', endDate: '2026-07-31', duration: 22, deliverable: 'UI设计规范', dependencies: ['t3-2-1'], assignee: 'm8', priority: '中', status: '已完成', description: '完成系统视觉设计和设计规范', parentId: 't3-2', children: [] }
        ]
      },
      {
        id: 't3-3', wbs: '3.3', name: '数据库设计', startDate: '2026-07-16', endDate: '2026-08-15', duration: 31, deliverable: '数据库设计文档', dependencies: ['t3-1'], assignee: 'm6', priority: '高', status: '已完成', description: '完成数据库表结构设计和优化', parentId: 't3',
        children: [
          { id: 't3-3-1', wbs: '3.3.1', name: '数据模型设计', startDate: '2026-07-16', endDate: '2026-08-05', duration: 21, deliverable: 'ER图', dependencies: [], assignee: 'm6', priority: '高', status: '已完成', description: '设计数据库实体关系模型', parentId: 't3-3', children: [] },
          { id: 't3-3-2', wbs: '3.3.2', name: '索引优化设计', startDate: '2026-08-01', endDate: '2026-08-15', duration: 15, deliverable: '索引方案', dependencies: ['t3-3-1'], assignee: 'm6', priority: '中', status: '已完成', description: '设计数据库索引和查询优化方案', parentId: 't3-3', children: [] }
        ]
      }
    ]
  },
  {
    id: 't4', wbs: '4', name: '开发实施阶段', startDate: '2026-08-16', endDate: '2026-11-30', duration: 107, deliverable: '系统源代码', dependencies: ['t3'], assignee: 'm2', priority: '高', status: '进行中', description: '完成系统各功能模块的开发实现', parentId: null,
    children: [
      {
        id: 't4-1', wbs: '4.1', name: '后端开发', startDate: '2026-08-16', endDate: '2026-11-15', duration: 92, deliverable: '后端服务', dependencies: [], assignee: 'm6', priority: '高', status: '进行中', description: '完成后端API和业务逻辑开发', parentId: 't4',
        children: [
          { id: 't4-1-1', wbs: '4.1.1', name: '用户管理模块', startDate: '2026-08-16', endDate: '2026-09-15', duration: 31, deliverable: '用户管理API', dependencies: [], assignee: 'm6', priority: '高', status: '已完成', description: '开发用户认证、授权和权限管理功能', parentId: 't4-1', children: [] },
          { id: 't4-1-2', wbs: '4.1.2', name: '交通管理模块', startDate: '2026-09-01', endDate: '2026-10-15', duration: 45, deliverable: '交通管理服务', dependencies: ['t4-1-1'], assignee: 'm6', priority: '高', status: '进行中', description: '开发交通流量监测和信号控制功能', parentId: 't4-1', children: [] },
          { id: 't4-1-3', wbs: '4.1.3', name: '数据分析模块', startDate: '2026-10-01', endDate: '2026-11-15', duration: 46, deliverable: '数据分析服务', dependencies: ['t4-1-1'], assignee: 'm6', priority: '中', status: '待办', description: '开发大数据分析和可视化功能', parentId: 't4-1', children: [] }
        ]
      },
      {
        id: 't4-2', wbs: '4.2', name: '前端开发', startDate: '2026-09-01', endDate: '2026-11-30', duration: 91, deliverable: '前端应用', dependencies: [], assignee: 'm5', priority: '高', status: '进行中', description: '完成前端界面和交互功能开发', parentId: 't4',
        children: [
          { id: 't4-2-1', wbs: '4.2.1', name: '管理后台开发', startDate: '2026-09-01', endDate: '2026-10-31', duration: 61, deliverable: '管理后台', dependencies: [], assignee: 'm5', priority: '高', status: '进行中', description: '开发系统管理后台界面', parentId: 't4-2', children: [] },
          { id: 't4-2-2', wbs: '4.2.2', name: '移动端开发', startDate: '2026-10-01', endDate: '2026-11-30', duration: 61, deliverable: '移动应用', dependencies: ['t4-2-1'], assignee: 'm5', priority: '中', status: '待办', description: '开发移动端应用和响应式适配', parentId: 't4-2', children: [] }
        ]
      },
      {
        id: 't4-3', wbs: '4.3', name: '数据集成', startDate: '2026-10-15', endDate: '2026-11-30', duration: 47, deliverable: '数据接口', dependencies: ['t4-1', 't4-2'], assignee: 'm9', priority: '中', status: '待办', description: '完成与外部系统的数据集成', parentId: 't4',
        children: [
          { id: 't4-3-1', wbs: '4.3.1', name: '第三方API集成', startDate: '2026-10-15', endDate: '2026-11-15', duration: 32, deliverable: '集成文档', dependencies: [], assignee: 'm9', priority: '中', status: '待办', description: '集成地图、支付等第三方服务', parentId: 't4-3', children: [] },
          { id: 't4-3-2', wbs: '4.3.2', name: '数据同步开发', startDate: '2026-11-01', endDate: '2026-11-30', duration: 30, deliverable: '同步服务', dependencies: ['t4-3-1'], assignee: 'm9', priority: '低', status: '待办', description: '开发多系统数据同步服务', parentId: 't4-3', children: [] }
        ]
      }
    ]
  },
  {
    id: 't5', wbs: '5', name: '测试验收阶段', startDate: '2026-12-01', endDate: '2026-12-31', duration: 31, deliverable: '验收报告', dependencies: ['t4'], assignee: 'm7', priority: '高', status: '待办', description: '完成系统测试、用户培训和项目验收', parentId: null,
    children: [
      {
        id: 't5-1', wbs: '5.1', name: '功能测试', startDate: '2026-12-01', endDate: '2026-12-15', duration: 15, deliverable: '测试报告', dependencies: [], assignee: 'm7', priority: '高', status: '待办', description: '完成系统功能测试和缺陷修复', parentId: 't5',
        children: [
          { id: 't5-1-1', wbs: '5.1.1', name: '单元测试', startDate: '2026-12-01', endDate: '2026-12-10', duration: 10, deliverable: '单元测试用例', dependencies: [], assignee: 'm7', priority: '高', status: '待办', description: '编写并执行单元测试', parentId: 't5-1', children: [] },
          { id: 't5-1-2', wbs: '5.1.2', name: '集成测试', startDate: '2026-12-06', endDate: '2026-12-15', duration: 10, deliverable: '集成测试报告', dependencies: ['t5-1-1'], assignee: 'm7', priority: '高', status: '待办', description: '执行系统集成测试', parentId: 't5-1', children: [] }
        ]
      },
      {
        id: 't5-2', wbs: '5.2', name: '用户培训', startDate: '2026-12-16', endDate: '2026-12-25', duration: 10, deliverable: '培训材料', dependencies: ['t5-1'], assignee: 'm2', priority: '中', status: '待办', description: '开展系统使用培训和文档交付', parentId: 't5',
        children: [
          { id: 't5-2-1', wbs: '5.2.1', name: '操作手册编写', startDate: '2026-12-16', endDate: '2026-12-22', duration: 7, deliverable: '操作手册', dependencies: [], assignee: 'm3', priority: '中', status: '待办', description: '编写系统操作手册', parentId: 't5-2', children: [] },
          { id: 't5-2-2', wbs: '5.2.2', name: '现场培训', startDate: '2026-12-20', endDate: '2026-12-25', duration: 6, deliverable: '培训记录', dependencies: ['t5-2-1'], assignee: 'm2', priority: '中', status: '待办', description: '开展现场操作培训', parentId: 't5-2', children: [] }
        ]
      }
    ]
  }
]

function flattenTasks(tasks: Task[]): Task[] {
  const result: Task[] = []
  function flatten(list: Task[]) {
    list.forEach(task => {
      result.push(task)
      if (task.children && task.children.length > 0) {
        flatten(task.children)
      }
    })
  }
  flatten(tasks)
  return result
}

function countTasksByLevel(tasks: Task[], targetLevel: number, currentLevel: number = 1): number {
  let count = 0
  tasks.forEach(task => {
    if (currentLevel === targetLevel) {
      count++
    }
    if (task.children && task.children.length > 0) {
      count += countTasksByLevel(task.children, targetLevel, currentLevel + 1)
    }
  })
  return count
}

export function initMockData(): boolean {
  try {
    localStorage.setItem('plan-tools-project', JSON.stringify(mockProject))
    localStorage.setItem('plan-tools-tasks', JSON.stringify({
      tasks: mockTasks,
      displaySettings: {
        showWBS: true, showName: true, showStartDate: true, showEndDate: true,
        showDuration: true, showDeliverable: true, showDependencies: false,
        showAssignee: true, showPriority: true, showStatus: true, showDescription: false
      },
      expandedTasks: mockTasks.map(t => t.id),
      lastSaved: new Date().toISOString()
    }))
    localStorage.setItem('plan-tools-ui', JSON.stringify({
      splitRatio: 0.4, autoSaveEnabled: true, autoSaveInterval: 30000
    }))
    return true
  } catch (error) {
    console.error('Failed to initialize mock data:', error)
    return false
  }
}

export function clearMockData(): boolean {
  try {
    localStorage.removeItem('plan-tools-project')
    localStorage.removeItem('plan-tools-tasks')
    localStorage.removeItem('plan-tools-ui')
    return true
  } catch (error) {
    console.error('Failed to clear mock data:', error)
    return false
  }
}

export function getTaskStatistics(): {
  total: number
  byLevel: { level1: number; level2: number; level3: number; level4: number; level5: number }
  byStatus: { completed: number; inProgress: number; todo: number }
  byPriority: { high: number; medium: number; low: number }
} {
  const flatTasks = flattenTasks(mockTasks)
  return {
    total: flatTasks.length,
    byLevel: {
      level1: mockTasks.length,
      level2: countTasksByLevel(mockTasks, 2),
      level3: countTasksByLevel(mockTasks, 3),
      level4: countTasksByLevel(mockTasks, 4),
      level5: countTasksByLevel(mockTasks, 5)
    },
    byStatus: {
      completed: flatTasks.filter(t => t.status === '已完成').length,
      inProgress: flatTasks.filter(t => t.status === '进行中').length,
      todo: flatTasks.filter(t => t.status === '待办').length
    },
    byPriority: {
      high: flatTasks.filter(t => t.priority === '高').length,
      medium: flatTasks.filter(t => t.priority === '中').length,
      low: flatTasks.filter(t => t.priority === '低').length
    }
  }
}
