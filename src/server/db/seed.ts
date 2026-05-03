import { db } from './index'
import { users, projects, tasks, members, promptTemplates, projectTemplates } from './schema'
import { hashPassword } from '../utils/auth'

async function seed() {
  console.log('🌱 Seeding database...')

  const passwordHash = await hashPassword('demo1234')

  const [demoUser] = await db.insert(users).values({
    email: 'demo@pmtools.com',
    passwordHash,
    displayName: '演示用户',
  }).returning({ id: users.id })

  console.log(`✅ Created demo user: ${demoUser.id}`)

  const [demoProject] = await db.insert(projects).values({
    ownerId: demoUser.id,
    name: '智慧城市建设项目',
    description: '某市智慧城市综合管理平台建设项目',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
  }).returning({ id: projects.id })

  console.log(`✅ Created demo project: ${demoProject.id}`)

  const demoMembers = [
    { projectId: demoProject.id, name: '张三', email: 'zhangsan@example.com', role: '项目经理', phone: '13800138001' },
    { projectId: demoProject.id, name: '李四', email: 'lisi@example.com', role: '技术负责人', phone: '13800138002' },
    { projectId: demoProject.id, name: '王五', email: 'wangwu@example.com', role: '测试工程师', phone: '13800138003' },
  ]

  await db.insert(members).values(demoMembers)
  console.log(`✅ Created ${demoMembers.length} members`)

  const demoTasks = [
    { projectId: demoProject.id, name: '项目启动阶段', wbsCode: '1', sortOrder: 0, status: 'completed', startDate: '2026-01-01', endDate: '2026-02-28', duration: 59, priority: 'high' },
    { projectId: demoProject.id, name: '需求调研', wbsCode: '1.1', sortOrder: 1, status: 'completed', startDate: '2026-01-01', endDate: '2026-01-31', duration: 31, priority: 'high', assignee: '张三' },
    { projectId: demoProject.id, name: '方案设计', wbsCode: '1.2', sortOrder: 2, status: 'completed', startDate: '2026-02-01', endDate: '2026-02-28', duration: 28, priority: 'high', assignee: '李四' },
    { projectId: demoProject.id, name: '开发实施阶段', wbsCode: '2', sortOrder: 3, status: 'in_progress', startDate: '2026-03-01', endDate: '2026-08-31', duration: 184, priority: 'high' },
    { projectId: demoProject.id, name: '前端开发', wbsCode: '2.1', sortOrder: 4, status: 'in_progress', startDate: '2026-03-01', endDate: '2026-05-31', duration: 92, priority: 'medium', assignee: '李四' },
    { projectId: demoProject.id, name: '后端开发', wbsCode: '2.2', sortOrder: 5, status: 'in_progress', startDate: '2026-03-01', endDate: '2026-06-30', duration: 122, priority: 'medium', assignee: '李四' },
    { projectId: demoProject.id, name: '系统测试', wbsCode: '2.3', sortOrder: 6, status: 'pending', startDate: '2026-07-01', endDate: '2026-08-31', duration: 62, priority: 'medium', assignee: '王五' },
    { projectId: demoProject.id, name: '验收交付阶段', wbsCode: '3', sortOrder: 7, status: 'pending', startDate: '2026-09-01', endDate: '2026-12-31', duration: 122, priority: 'high' },
    { projectId: demoProject.id, name: '用户培训', wbsCode: '3.1', sortOrder: 8, status: 'pending', startDate: '2026-09-01', endDate: '2026-10-15', duration: 45, priority: 'medium', assignee: '张三' },
    { projectId: demoProject.id, name: '系统上线', wbsCode: '3.2', sortOrder: 9, status: 'pending', startDate: '2026-10-16', endDate: '2026-11-30', duration: 46, priority: 'high', isMilestone: true, assignee: '李四' },
    { projectId: demoProject.id, name: '项目验收', wbsCode: '3.3', sortOrder: 10, status: 'pending', startDate: '2026-12-01', endDate: '2026-12-31', duration: 31, priority: 'high', isMilestone: true, assignee: '张三' },
  ]

  await db.insert(tasks).values(demoTasks)
  console.log(`✅ Created ${demoTasks.length} tasks`)

  console.log('🎉 Seed completed!')
}

async function seedTemplates() {
  console.log('🌱 Seeding templates...')

  const officialPrompts = [
    {
      name: '通用项目管理助手',
      description: '适用于各类项目的通用助手，提供项目进度分析、风险识别和优化建议',
      systemPrompt: '你是一位经验丰富的项目管理顾问。在回答时：1）优先关注项目关键路径和瓶颈；2）用数据说话，引用具体的任务状态和工期；3）给出可执行的建议，而非泛泛而谈；4）关注风险预警，主动识别延期和资源冲突。',
      category: 'general',
      isOfficial: true,
      sortOrder: 1,
    },
    {
      name: '软件开发专家',
      description: '专注于软件研发项目管理，熟悉敏捷开发、DevOps 等方法论',
      systemPrompt: '你是一位资深软件研发管理专家。在回答时：1）优先使用敏捷开发术语（Sprint、Backlog、Velocity等）；2）关注技术债务和代码质量指标；3）建议使用 CI/CD、代码审查等最佳实践；4）关注团队协作效率，建议站会、回顾会等仪式；5）对需求变更给出影响分析。',
      category: 'industry',
      isOfficial: true,
      sortOrder: 2,
    },
    {
      name: '建筑工程顾问',
      description: '专注于建筑工程项目管理，熟悉施工流程、安全规范和验收标准',
      systemPrompt: '你是一位建筑工程项目管理顾问。在回答时：1）使用建筑行业术语（施工图、验收规范、安全交底等）；2）关注施工安全和质量管控；3）建议关键工序的验收节点；4）关注天气、材料供应等外部因素对工期的影响；5）重视合规性，提醒相关法规和标准要求。',
      category: 'industry',
      isOfficial: true,
      sortOrder: 3,
    },
    {
      name: '周报/月报生成器',
      description: '专注于生成项目周报和月报，自动汇总进度、风险和下周计划',
      systemPrompt: '你是一位项目报告撰写专家。在生成报告时：1）使用结构化格式（本周完成、进行中、下周计划、风险与问题）；2）用数据量化进度（完成率、延期天数）；3）突出关键里程碑状态；4）风险和问题要具体，附带建议措施；5）语言简洁专业，适合向管理层汇报。',
      category: 'report',
      isOfficial: true,
      sortOrder: 4,
    },
    {
      name: '项目风险分析师',
      description: '专注于项目风险识别、评估和应对策略建议',
      systemPrompt: '你是一位项目风险管理专家。在分析时：1）从进度、资源、技术、外部四个维度识别风险；2）对每个风险评估发生概率和影响程度（高/中/低）；3）给出具体的应对策略（规避、转移、减轻、接受）；4）建议建立风险登记册和定期评审机制；5）关注风险之间的关联和连锁效应。',
      category: 'chat',
      isOfficial: true,
      sortOrder: 5,
    },
  ]

  const insertedPrompts = await db.insert(promptTemplates).values(officialPrompts).returning({ id: promptTemplates.id })
  console.log(`✅ Created ${insertedPrompts.length} official prompt templates`)

  const officialProjects = [
    {
      name: '软件开发项目',
      icon: '💻',
      description: '适用于网站、APP、系统开发等项目',
      industry: '软件开发',
      isOfficial: true,
      linkedPromptId: insertedPrompts[1]?.id || null,
      phases: [
        { name: '需求分析', tasks: [{ name: '需求调研', duration: 3, deliverable: '需求调研报告' }, { name: '需求分析', duration: 5, deliverable: '需求规格说明书' }, { name: '原型设计', duration: 4, deliverable: '原型图' }] },
        { name: '设计阶段', tasks: [{ name: 'UI设计', duration: 5, deliverable: 'UI设计稿' }, { name: '架构设计', duration: 3, deliverable: '架构设计文档' }, { name: '数据库设计', duration: 3, deliverable: '数据库设计文档' }] },
        { name: '开发阶段', tasks: [{ name: '前端开发', duration: 15, deliverable: '前端代码' }, { name: '后端开发', duration: 15, deliverable: '后端代码' }, { name: '接口联调', duration: 5, deliverable: '联调报告' }] },
        { name: '测试阶段', tasks: [{ name: '功能测试', duration: 5, deliverable: '测试用例' }, { name: '性能测试', duration: 3, deliverable: '性能测试报告' }, { name: 'Bug修复', duration: 5, deliverable: 'Bug修复记录' }] },
        { name: '上线部署', tasks: [{ name: '部署准备', duration: 2, deliverable: '部署方案' }, { name: '上线发布', duration: 1, deliverable: '上线报告' }, { name: '线上验证', duration: 2, deliverable: '验证报告' }] },
      ],
    },
    {
      name: '市场营销活动',
      icon: '📢',
      description: '适用于品牌推广、营销活动策划等项目',
      industry: '市场营销',
      isOfficial: true,
      phases: [
        { name: '策划阶段', tasks: [{ name: '市场调研', duration: 5, deliverable: '市场调研报告' }, { name: '目标定位', duration: 2, deliverable: '目标人群画像' }, { name: '创意策划', duration: 5, deliverable: '创意方案' }] },
        { name: '准备阶段', tasks: [{ name: '素材制作', duration: 7, deliverable: '营销素材' }, { name: '渠道对接', duration: 3, deliverable: '渠道合作方案' }, { name: '预算编制', duration: 2, deliverable: '预算表' }] },
        { name: '执行阶段', tasks: [{ name: '活动上线', duration: 1, deliverable: '上线确认' }, { name: '数据监控', duration: 10, deliverable: '数据日报' }, { name: '效果优化', duration: 5, deliverable: '优化方案' }] },
        { name: '复盘阶段', tasks: [{ name: '数据汇总', duration: 2, deliverable: '效果报告' }, { name: '经验总结', duration: 2, deliverable: '复盘报告' }] },
      ],
    },
    {
      name: '建筑工程项目',
      icon: '🏗️',
      description: '适用于房屋建筑、基础设施等工程项目',
      industry: '建筑工程',
      isOfficial: true,
      linkedPromptId: insertedPrompts[2]?.id || null,
      phases: [
        { name: '前期准备', tasks: [{ name: '项目立项', duration: 10, deliverable: '立项报告' }, { name: '方案设计', duration: 15, deliverable: '设计方案' }, { name: '施工图设计', duration: 20, deliverable: '施工图' }, { name: '招标采购', duration: 15, deliverable: '中标通知书' }] },
        { name: '施工阶段', tasks: [{ name: '基础工程', duration: 30, deliverable: '基础验收报告' }, { name: '主体工程', duration: 60, deliverable: '主体结构验收' }, { name: '装饰装修', duration: 30, deliverable: '装修验收' }, { name: '设备安装', duration: 20, deliverable: '安装验收' }] },
        { name: '竣工验收', tasks: [{ name: '竣工自检', duration: 5, deliverable: '自检报告' }, { name: '竣工验收', duration: 5, deliverable: '竣工验收报告' }, { name: '资料移交', duration: 5, deliverable: '竣工资料' }] },
      ],
    },
    {
      name: '产品发布',
      icon: '🚀',
      description: '适用于新产品发布、版本上线等项目',
      industry: '产品发布',
      isOfficial: true,
      phases: [
        { name: '发布准备', tasks: [{ name: '功能冻结', duration: 1, deliverable: '功能清单' }, { name: '发布文档编写', duration: 3, deliverable: '发布说明' }, { name: '培训材料准备', duration: 3, deliverable: '培训材料' }] },
        { name: '灰度测试', tasks: [{ name: '内部测试', duration: 3, deliverable: '内部测试报告' }, { name: '灰度发布', duration: 5, deliverable: '灰度数据报告' }, { name: '问题修复', duration: 3, deliverable: '修复记录' }] },
        { name: '正式发布', tasks: [{ name: '全量发布', duration: 1, deliverable: '发布确认' }, { name: '监控值守', duration: 3, deliverable: '监控报告' }, { name: '用户反馈收集', duration: 5, deliverable: '反馈汇总' }] },
        { name: '发布复盘', tasks: [{ name: '数据分析', duration: 2, deliverable: '发布数据报告' }, { name: '经验总结', duration: 1, deliverable: '复盘文档' }] },
      ],
    },
    {
      name: '教育课程',
      icon: '📚',
      description: '适用于课程开发、培训项目等',
      industry: '教育培训',
      isOfficial: true,
      phases: [
        { name: '课程规划', tasks: [{ name: '需求分析', duration: 3, deliverable: '培训需求分析' }, { name: '课程大纲', duration: 5, deliverable: '课程大纲' }, { name: '教学设计', duration: 5, deliverable: '教学设计方案' }] },
        { name: '内容开发', tasks: [{ name: '课件制作', duration: 10, deliverable: '课件文件' }, { name: '案例编写', duration: 5, deliverable: '案例集' }, { name: '练习设计', duration: 3, deliverable: '练习题库' }] },
        { name: '试讲验证', tasks: [{ name: '内部试讲', duration: 2, deliverable: '试讲反馈' }, { name: '内容优化', duration: 3, deliverable: '优化版本' }] },
        { name: '正式授课', tasks: [{ name: '课程交付', duration: 5, deliverable: '授课记录' }, { name: '效果评估', duration: 2, deliverable: '评估报告' }] },
      ],
    },
    {
      name: '活动策划',
      icon: '🎉',
      description: '适用于会议、展览、庆典等活动的策划与执行',
      industry: '活动策划',
      isOfficial: true,
      phases: [
        { name: '策划阶段', tasks: [{ name: '活动定位', duration: 2, deliverable: '活动策划书' }, { name: '预算编制', duration: 2, deliverable: '预算方案' }, { name: '场地选址', duration: 3, deliverable: '场地对比方案' }] },
        { name: '筹备阶段', tasks: [{ name: '供应商对接', duration: 5, deliverable: '供应商合同' }, { name: '物料制作', duration: 7, deliverable: '活动物料' }, { name: '人员安排', duration: 3, deliverable: '人员分工表' }, { name: '宣传推广', duration: 10, deliverable: '推广方案' }] },
        { name: '执行阶段', tasks: [{ name: '现场搭建', duration: 2, deliverable: '搭建验收' }, { name: '活动执行', duration: 1, deliverable: '活动记录' }, { name: '现场撤场', duration: 1, deliverable: '撤场确认' }] },
        { name: '总结阶段', tasks: [{ name: '效果统计', duration: 2, deliverable: '效果报告' }, { name: '费用结算', duration: 3, deliverable: '结算报告' }] },
      ],
    },
  ]

  const insertedProjects = await db.insert(projectTemplates).values(officialProjects).returning({ id: projectTemplates.id })
  console.log(`✅ Created ${insertedProjects.length} official project templates`)

  console.log('🎉 Template seed completed!')
}

seedTemplates().catch((err) => {
  console.error('❌ Template seed failed:', err)
  process.exit(1)
})
