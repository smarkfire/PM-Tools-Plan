export interface TemplateTask {
  name: string
  duration: number
  deliverable: string
}

export interface TemplatePhase {
  name: string
  tasks: TemplateTask[]
}

export interface IndustryTemplate {
  id: string
  name: string
  icon: string
  description: string
  phases: TemplatePhase[]
}

export const industryTemplates: IndustryTemplate[] = [
  {
    id: 'software-dev',
    name: '软件开发项目',
    icon: '💻',
    description: '适用于网站、APP、系统开发等项目',
    phases: [
      {
        name: '需求分析',
        tasks: [
          { name: '需求调研', duration: 3, deliverable: '需求调研报告' },
          { name: '需求分析', duration: 5, deliverable: '需求规格说明书' },
          { name: '原型设计', duration: 4, deliverable: '原型图' }
        ]
      },
      {
        name: '架构设计',
        tasks: [
          { name: '技术方案设计', duration: 3, deliverable: '技术方案文档' },
          { name: '数据库设计', duration: 2, deliverable: '数据库设计文档' },
          { name: 'API接口设计', duration: 3, deliverable: 'API接口文档' }
        ]
      },
      {
        name: '开发阶段',
        tasks: [
          { name: '前端开发', duration: 15, deliverable: '前端代码' },
          { name: '后端开发', duration: 15, deliverable: '后端代码' },
          { name: '接口联调', duration: 5, deliverable: '联调报告' }
        ]
      },
      {
        name: '测试阶段',
        tasks: [
          { name: '单元测试', duration: 5, deliverable: '测试用例' },
          { name: '集成测试', duration: 5, deliverable: '测试报告' },
          { name: '用户验收测试', duration: 3, deliverable: '验收报告' }
        ]
      },
      {
        name: '部署上线',
        tasks: [
          { name: '部署准备', duration: 2, deliverable: '部署清单' },
          { name: '正式部署', duration: 1, deliverable: '生产环境' },
          { name: '上线监控', duration: 3, deliverable: '监控报告' }
        ]
      }
    ]
  },
  {
    id: 'marketing',
    name: '市场营销活动',
    icon: '📢',
    description: '适用于市场推广、品牌活动等',
    phases: [
      {
        name: '市场调研',
        tasks: [
          { name: '目标市场分析', duration: 3, deliverable: '市场分析报告' },
          { name: '竞品分析', duration: 2, deliverable: '竞品分析报告' },
          { name: '用户画像研究', duration: 3, deliverable: '用户画像' }
        ]
      },
      {
        name: '策划阶段',
        tasks: [
          { name: '活动策划', duration: 5, deliverable: '活动策划案' },
          { name: '预算制定', duration: 2, deliverable: '预算表' },
          { name: '资源协调', duration: 3, deliverable: '资源清单' }
        ]
      },
      {
        name: '执行阶段',
        tasks: [
          { name: '物料准备', duration: 5, deliverable: '宣传物料' },
          { name: '渠道推广', duration: 10, deliverable: '推广数据' },
          { name: '活动执行', duration: 7, deliverable: '活动执行报告' }
        ]
      },
      {
        name: '复盘阶段',
        tasks: [
          { name: '数据收集分析', duration: 3, deliverable: '数据分析报告' },
          { name: '效果评估', duration: 2, deliverable: '效果评估报告' },
          { name: '总结复盘', duration: 2, deliverable: '复盘报告' }
        ]
      }
    ]
  },
  {
    id: 'construction',
    name: '建筑工程项目',
    icon: '🏗️',
    description: '适用于建筑施工、装修等工程项目',
    phases: [
      {
        name: '前期准备',
        tasks: [
          { name: '项目立项', duration: 5, deliverable: '立项批复' },
          { name: '设计图纸', duration: 10, deliverable: '设计图纸' },
          { name: '招投标', duration: 7, deliverable: '中标通知书' }
        ]
      },
      {
        name: '基础工程',
        tasks: [
          { name: '场地平整', duration: 5, deliverable: '场地验收' },
          { name: '基础施工', duration: 15, deliverable: '基础验收' },
          { name: '主体结构', duration: 20, deliverable: '主体验收' }
        ]
      },
      {
        name: '装修工程',
        tasks: [
          { name: '水电安装', duration: 10, deliverable: '水电验收' },
          { name: '装修施工', duration: 15, deliverable: '装修验收' },
          { name: '设备安装', duration: 7, deliverable: '设备调试' }
        ]
      },
      {
        name: '验收交付',
        tasks: [
          { name: '竣工验收', duration: 3, deliverable: '竣工验收报告' },
          { name: '资料归档', duration: 3, deliverable: '档案资料' },
          { name: '交付使用', duration: 1, deliverable: '交付确认书' }
        ]
      }
    ]
  }
]

export function getTemplateById(id: string): IndustryTemplate | undefined {
  return industryTemplates.find(t => t.id === id)
}

export function getTotalTasks(template: IndustryTemplate): number {
  return template.phases.reduce((sum, phase) => sum + phase.tasks.length, 0)
}

export function getTotalDuration(template: IndustryTemplate): number {
  return template.phases.reduce(
    (sum, phase) => sum + phase.tasks.reduce((s, t) => s + t.duration, 0),
    0
  )
}
