# 自定义 Prompt 模板 + 模板市场 设计文档

> 日期: 2026-05-03
> 状态: 已批准
> 方案: 数据库方案（PostgreSQL + Drizzle ORM）

## 1. 概述

为 PLAN-Tools 添加两类自定义模板功能：

1. **AI Prompt 模板** — 用户可自定义 AI 的 System Prompt，影响 AI 回答风格和专业领域
2. **项目计划模板** — 用户可从现有项目创建模板，快速复用项目结构

同时提供**内置官方模板库**（模板市场），用户可浏览和一键导入/应用。

## 2. 数据库 Schema

### 2.1 prompt_templates 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK, defaultRandom | 主键 |
| userId | uuid | FK→users.id, ON DELETE CASCADE | 创建者（官方模板为 null） |
| name | varchar(100) | NOT NULL | 模板名称 |
| description | text | | 模板描述 |
| systemPrompt | text | NOT NULL | System Prompt 内容 |
| category | varchar(50) | NOT NULL, default 'general' | 分类（general/industry/report/chat） |
| isOfficial | boolean | NOT NULL, default false | 是否官方模板 |
| sortOrder | integer | default 0 | 排序权重 |
| createdAt | timestamp with tz | NOT NULL, defaultNow | 创建时间 |
| updatedAt | timestamp with tz | NOT NULL, defaultNow | 更新时间 |

索引：
- `prompt_templates_user_id_idx` ON (userId)
- `prompt_templates_category_idx` ON (category)
- `prompt_templates_is_official_idx` ON (isOfficial)

### 2.2 project_templates 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK, defaultRandom | 主键 |
| userId | uuid | FK→users.id, ON DELETE CASCADE | 创建者（官方模板为 null） |
| name | varchar(200) | NOT NULL | 模板名称 |
| icon | varchar(10) | | 图标 emoji |
| description | text | | 模板描述 |
| industry | varchar(50) | | 行业类型 |
| phases | jsonb | NOT NULL | 阶段和任务结构 |
| linkedPromptId | uuid | FK→prompt_templates.id | 关联的 AI Prompt 模板（可选） |
| isOfficial | boolean | NOT NULL, default false | 是否官方模板 |
| usageCount | integer | NOT NULL, default 0 | 使用次数 |
| createdAt | timestamp with tz | NOT NULL, defaultNow | 创建时间 |
| updatedAt | timestamp with tz | NOT NULL, defaultNow | 更新时间 |

索引：
- `project_templates_user_id_idx` ON (userId)
- `project_templates_is_official_idx` ON (isOfficial)
- `project_templates_industry_idx` ON (industry)

### 2.3 phases jsonb 结构

复用现有 `TemplatePhase` 接口：

```typescript
interface TemplatePhase {
  name: string
  tasks: Array<{
    name: string
    duration: number
    deliverable: string
  }>
}
```

### 2.4 种子数据

官方项目模板（6 个）：
1. 软件开发项目 💻
2. 市场营销活动 📢
3. 建筑工程项目 🏗️
4. 产品发布 🚀
5. 教育课程 📚
6. 活动策划 🎉

官方 Prompt 模板（5 个）：
1. 通用项目管理助手 (general)
2. 软件开发专家 (industry)
3. 建筑工程顾问 (industry)
4. 周报/月报生成器 (report)
5. 项目风险分析师 (chat)

## 3. API 设计

### 3.1 Prompt 模板 API

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/templates/prompts` | 获取 Prompt 模板列表（官方+自己的） | ✅ |
| GET | `/api/templates/prompts/:id` | 获取单个 Prompt 模板详情 | ✅ |
| POST | `/api/templates/prompts` | 创建自定义 Prompt 模板 | ✅ |
| PUT | `/api/templates/prompts/:id` | 编辑自定义 Prompt 模板 | ✅ |
| DELETE | `/api/templates/prompts/:id` | 删除自定义 Prompt 模板（官方不可删） | ✅ |

### 3.2 项目计划模板 API

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/templates/projects` | 获取项目模板列表（官方+自己的） | ✅ |
| GET | `/api/templates/projects/:id` | 获取单个项目模板详情 | ✅ |
| POST | `/api/templates/projects` | 从现有项目创建模板 | ✅ |
| PUT | `/api/templates/projects/:id` | 编辑自定义项目模板 | ✅ |
| DELETE | `/api/templates/projects/:id` | 删除自定义项目模板（官方不可删） | ✅ |
| POST | `/api/templates/projects/:id/apply` | 应用模板创建新项目 | ✅ |

### 3.3 模板市场 API

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/templates/market` | 获取所有官方模板（Prompt + 项目），按分类分组 | ✅ |

### 3.4 AI 集成

- AI 请求时，若项目关联了 `linkedPromptId`，自动将该 Prompt 模板的 `systemPrompt` 追加到 AI 调用的 system message 中
- 修改 `context-builder.ts` 的 `buildSystemPrompt` 函数，增加 `extraPrompt?: string` 参数

## 4. 前端组件

### 4.1 新增组件

| 组件 | 位置 | 说明 |
|------|------|------|
| `PromptTemplateManager.vue` | `components/AIAssistant/` | Prompt 模板管理：列表 + 创建/编辑弹窗 + 预览 |
| `PromptTemplateEditor.vue` | `components/AIAssistant/` | Prompt 编辑器：名称/分类/内容编辑 |
| `ProjectTemplateManager.vue` | `components/ProjectInfo/` | 项目模板管理：从现有项目另存为模板 |
| `TemplateMarket.vue` | `components/AIAssistant/` | 模板市场：分类 Tab + 卡片网格 + 导入/应用 |

### 4.2 改造现有组件

| 组件 | 改动 |
|------|------|
| `AITemplateSelector.vue` | 从读取 `templates.ts` 改为调用 `/api/templates/projects`，增加"从模板市场导入"入口 |
| `AIChatDrawer.vue` | 增加 Prompt 模板选择下拉框 |
| `ProjectInfoForm.vue` | 增加"另存为模板"按钮 |
| `context-builder.ts` | `buildSystemPrompt` 增加 `extraPrompt` 参数 |

### 4.3 交互流程

1. **使用 Prompt 模板**：AI 对话 → 选择 Prompt 模板 → 模板内容追加到 systemPrompt → AI 回答风格变化
2. **创建项目模板**：项目设置 → 另存为模板 → 填写名称/描述 → 保存到数据库
3. **浏览模板市场**：AI 助手/项目创建 → 模板市场 Tab → 浏览官方模板 → 一键应用/导入
4. **项目模板关联 Prompt**：创建项目模板时可选关联一个 Prompt 模板，应用项目模板时自动关联

## 5. 错误处理

- 官方模板不可编辑/删除，返回 403
- 自定义模板只能编辑/删除自己的，返回 403
- Prompt 内容不能为空，最大 5000 字符
- 项目模板 phases 必须包含至少 1 个阶段和 1 个任务
- 应用模板时自动递增 usageCount

## 6. 安全

- 所有模板 API 需要认证
- 输入验证：名称/描述/Prompt 内容均经过 sanitizeString 处理
- 速率限制：模板创建 10 次/分钟
