/**
 * Mock data for testing PLAN-Tools application
 */

export const mockProject = {
  id: 'mock-project-1',
  name: '示例项目 - 企业管理系统开发',
  startDate: '2026-04-20',
  endDate: '2026-06-30',
  description: '这是一个示例项目，展示了PLAN-Tools的各项功能。项目目标是开发一个完整的企业管理系统，包括用户管理、权限管理、业务流程管理等核心模块。',
  members: [
    {
      id: 'm1',
      name: '张伟',
      phone: '13800138001',
      email: 'zhangwei@example.com',
      role: '项目经理'
    },
    {
      id: 'm2',
      name: '李娜',
      phone: '13800138002',
      email: 'lina@example.com',
      role: '产品经理'
    },
    {
      id: 'm3',
      name: '王强',
      phone: '13800138003',
      email: 'wangqiang@example.com',
      role: '技术负责人'
    },
    {
      id: 'm4',
      name: '刘芳',
      phone: '13800138004',
      email: 'liufang@example.com',
      role: 'UI设计师'
    },
    {
      id: 'm5',
      name: '陈明',
      phone: '13800138005',
      email: 'chenming@example.com',
      role: '开发工程师'
    },
    {
      id: 'm6',
      name: '赵丽',
      phone: '13800138006',
      email: 'zhaoli@example.com',
      role: '测试工程师'
    }
  ]
}

export const mockTasks = [
  {
    id: 't1',
    wbs: '1',
    name: '项目启动',
    startDate: '2026-04-20',
    endDate: '2026-04-25',
    duration: 5,
    deliverable: '项目章程',
    dependencies: [],
    assignee: 'm1',
    priority: '高',
    status: '已完成',
    description: '项目立项、组建团队、确定项目范围和目标',
    parentId: null,
    children: [
      {
        id: 't1-1',
        wbs: '1.1',
        name: '需求调研',
        startDate: '2026-04-20',
        endDate: '2026-04-22',
        duration: 3,
        deliverable: '需求调研报告',
        dependencies: [],
        assignee: 'm2',
        priority: '高',
        status: '已完成',
        description: '调研用户需求，整理业务流程',
        parentId: 't1',
        children: []
      },
      {
        id: 't1-2',
        wbs: '1.2',
        name: '项目立项',
        startDate: '2026-04-23',
        endDate: '2026-04-25',
        duration: 3,
        deliverable: '项目章程',
        dependencies: ['t1-1'],
        assignee: 'm1',
        priority: '高',
        status: '已完成',
        description: '完成项目立项审批，组建项目团队',
        parentId: 't1',
        children: []
      }
    ]
  },
  {
    id: 't2',
    wbs: '2',
    name: '系统设计',
    startDate: '2026-04-26',
    endDate: '2026-05-10',
    duration: 11,
    deliverable: '系统设计文档',
    dependencies: ['t1'],
    assignee: 'm3',
    priority: '高',
    status: '已完成',
    description: '完成系统架构设计、数据库设计、接口设计',
    parentId: null,
    children: [
      {
        id: 't2-1',
        wbs: '2.1',
        name: 'UI设计',
        startDate: '2026-04-26',
        endDate: '2026-05-03',
        duration: 6,
        deliverable: 'UI设计稿',
        dependencies: [],
        assignee: 'm4',
        priority: '中',
        status: '已完成',
        description: '完成系统界面设计',
        parentId: 't2',
        children: []
      },
      {
        id: 't2-2',
        wbs: '2.2',
        name: '技术架构设计',
        startDate: '2026-04-26',
        endDate: '2026-05-05',
        duration: 8,
        deliverable: '架构设计文档',
        dependencies: [],
        assignee: 'm3',
        priority: '高',
        status: '已完成',
        description: '完成系统架构设计、技术选型',
        parentId: 't2',
        children: []
      },
      {
        id: 't2-3',
        wbs: '2.3',
        name: '数据库设计',
        startDate: '2026-05-04',
        endDate: '2026-05-10',
        duration: 5,
        deliverable: '数据库设计文档',
        dependencies: ['t2-2'],
        assignee: 'm3',
        priority: '高',
        status: '已完成',
        description: '完成数据库表结构设计',
        parentId: 't2',
        children: []
      }
    ]
  },
  {
    id: 't3',
    wbs: '3',
    name: '系统开发',
    startDate: '2026-05-11',
    endDate: '2026-06-10',
    duration: 23,
    deliverable: '系统源代码',
    dependencies: ['t2'],
    assignee: 'm5',
    priority: '高',
    status: '进行中',
    description: '完成系统各模块的开发',
    parentId: null,
    children: [
      {
        id: 't3-1',
        wbs: '3.1',
        name: '用户模块开发',
        startDate: '2026-05-11',
        endDate: '2026-05-20',
        duration: 8,
        deliverable: '用户模块',
        dependencies: [],
        assignee: 'm5',
        priority: '高',
        status: '已完成',
        description: '完成用户登录、注册、权限管理等功能',
        parentId: 't3',
        children: []
      },
      {
        id: 't3-2',
        wbs: '3.2',
        name: '业务模块开发',
        startDate: '2026-05-21',
        endDate: '2026-06-05',
        duration: 12,
        deliverable: '业务模块',
        dependencies: ['t3-1'],
        assignee: 'm5',
        priority: '高',
        status: '进行中',
        description: '完成核心业务流程开发',
        parentId: 't3',
        children: []
      },
      {
        id: 't3-3',
        wbs: '3.3',
        name: '报表模块开发',
        startDate: '2026-06-01',
        endDate: '2026-06-10',
        duration: 8,
        deliverable: '报表模块',
        dependencies: ['t3-2'],
        assignee: 'm5',
        priority: '中',
        status: '待办',
        description: '完成数据统计和报表功能',
        parentId: 't3',
        children: []
      }
    ]
  },
  {
    id: 't4',
    wbs: '4',
    name: '系统测试',
    startDate: '2026-06-11',
    endDate: '2026-06-20',
    duration: 8,
    deliverable: '测试报告',
    dependencies: ['t3'],
    assignee: 'm6',
    priority: '高',
    status: '待办',
    description: '完成系统功能测试、性能测试、安全测试',
    parentId: null,
    children: [
      {
        id: 't4-1',
        wbs: '4.1',
        name: '功能测试',
        startDate: '2026-06-11',
        endDate: '2026-06-16',
        duration: 5,
        deliverable: '功能测试用例',
        dependencies: [],
        assignee: 'm6',
        priority: '高',
        status: '待办',
        description: '完成功能测试用例编写和执行',
        parentId: 't4',
        children: []
      },
      {
        id: 't4-2',
        wbs: '4.2',
        name: '性能测试',
        startDate: '2026-06-15',
        endDate: '2026-06-18',
        duration: 3,
        deliverable: '性能测试报告',
        dependencies: ['t4-1'],
        assignee: 'm6',
        priority: '中',
        status: '待办',
        description: '完成系统性能测试',
        parentId: 't4',
        children: []
      },
      {
        id: 't4-3',
        wbs: '4.3',
        name: 'Bug修复',
        startDate: '2026-06-17',
        endDate: '2026-06-20',
        duration: 3,
        deliverable: 'Bug修复清单',
        dependencies: ['t4-2'],
        assignee: 'm5',
        priority: '高',
        status: '待办',
        description: '修复测试发现的Bug',
        parentId: 't4',
        children: []
      }
    ]
  },
  {
    id: 't5',
    wbs: '5',
    name: '系统部署',
    startDate: '2026-06-21',
    endDate: '2026-06-25',
    duration: 5,
    deliverable: '部署文档',
    dependencies: ['t4'],
    assignee: 'm3',
    priority: '高',
    status: '待办',
    description: '完成系统部署和上线',
    parentId: null,
    children: [
      {
        id: 't5-1',
        wbs: '5.1',
        name: '环境准备',
        startDate: '2026-06-21',
        endDate: '2026-06-22',
        duration: 2,
        deliverable: '服务器环境',
        dependencies: [],
        assignee: 'm3',
        priority: '高',
        status: '待办',
        description: '准备生产环境服务器',
        parentId: 't5',
        children: []
      },
      {
        id: 't5-2',
        wbs: '5.2',
        name: '系统部署',
        startDate: '2026-06-23',
        endDate: '2026-06-24',
        duration: 2,
        deliverable: '已部署系统',
        dependencies: ['t5-1'],
        assignee: 'm3',
        priority: '高',
        status: '待办',
        description: '部署系统到生产环境',
        parentId: 't5',
        children: []
      },
      {
        id: 't5-3',
        wbs: '5.3',
        name: '系统验收',
        startDate: '2026-06-25',
        endDate: '2026-06-25',
        duration: 1,
        deliverable: '验收报告',
        dependencies: ['t5-2'],
        assignee: 'm1',
        priority: '高',
        status: '待办',
        description: '项目验收和交付',
        parentId: 't5',
        children: []
      }
    ]
  }
]

/**
 * Initialize mock data in localStorage
 */
export function initMockData() {
  try {
    // Save project data
    localStorage.setItem('plan-tools-project', JSON.stringify(mockProject))

    // Save tasks data
    localStorage.setItem('plan-tools-tasks', JSON.stringify({
      tasks: mockTasks,
      displaySettings: {
        showWBS: true,
        showName: true,
        showStartDate: true,
        showEndDate: true,
        showDuration: true,
        showDeliverable: true,
        showDependencies: false,
        showAssignee: true,
        showPriority: true,
        showStatus: true,
        showDescription: false
      },
      expandedTasks: mockTasks.map(t => t.id),
      lastSaved: new Date().toISOString()
    }))

    // Save UI settings
    localStorage.setItem('plan-tools-ui', JSON.stringify({
      splitRatio: 0.4,
      autoSaveEnabled: true,
      autoSaveInterval: 30000
    }))

    return true
  } catch (error) {
    console.error('Failed to initialize mock data:', error)
    return false
  }
}

/**
 * Clear all mock data from localStorage
 */
export function clearMockData() {
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
