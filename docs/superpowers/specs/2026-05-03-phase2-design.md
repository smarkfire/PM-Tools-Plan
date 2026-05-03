# Phase 2 设计文档：数据库持久化 + 用户系统 + 只读分享

> 版本: v0.4.0
> 日期: 2026-05-03
> 状态: 已批准

---

## 1. 概述

### 1.1 目标

Phase 2 在 Phase 1 MVP 基础上，实现以下核心能力：

1. **数据持久化** — 从 localStorage 迁移到 PostgreSQL，数据不再因换浏览器/设备而丢失
2. **用户系统** — 邮箱+密码注册登录，每个用户独立管理自己的项目
3. **只读分享** — 做完计划后生成分享链接，他人无需登录即可只读查看
4. **多项目管理** — 用户可创建和管理多个项目

### 1.2 不做

- 多人协作编辑（Phase 3）
- OAuth 第三方登录（后续扩展）
- 实时协同（Phase 3）

### 1.3 技术选型

| 组件 | 选择 | 理由 |
|------|------|------|
| ORM | Drizzle ORM | TypeScript-first，轻量，与 Nuxt 3 无缝衔接 |
| 数据库 | PostgreSQL | 功能强大，docker-compose 已预留，适合后续扩展 |
| 认证 | JWT (access + refresh) | 无状态，自托管友好 |
| 密码哈希 | bcrypt | 业界标准 |
| 分享 Token | nanoid | 短且不可猜测 |

---

## 2. 数据库 Schema

### 2.1 ER 图

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   users      │     │   projects       │     │   tasks           │
├─────────────┤     ├─────────────────┤     ├──────────────────┤
│ id (uuid)    │◄──┐│ id (uuid)        │◄──┐│ id (uuid)         │
│ email        │   ││ owner_id (fk)    │   ││ project_id (fk)   │
│ password_hash│   ││ name             │   ││ parent_id (fk)    │
│ display_name │   ││ description      │   ││ wbs_code          │
│ avatar_url   │   ││ start_date       │   ││ name              │
│ created_at   │   ││ end_date         │   ││ start_date        │
│ updated_at   │   ││ created_at       │   ││ end_date          │
└─────────────┘   ││ updated_at       │   ││ duration          │
                   │└─────────────────┘   ││ deliverable       │
                   │                       ││ assignee          │
                   │  ┌─────────────────┐  ││ priority          │
                   │  │   members        │  ││ status            │
                   │  ├─────────────────┤  ││ is_milestone(bool)│
                   │  │ id (uuid)        │  ││ description       │
                   │  │ project_id (fk)  │  ││ sort_order        │
                   └──│ user_id (fk,null)│  ││ created_at        │
                      │ name             │  ││ updated_at        │
                      │ email            │  │└──────────────────┘
                      │ role             │  │
                      │ phone            │  │  ┌──────────────┐
                      │ created_at       │  │  │  shares       │
                      └─────────────────┘  │  ├──────────────┤
                                           │  │ id (uuid)     │
                                           │  │ project_id(fk)│
                                           │  │ share_token   │
                                           │  │ created_by(fk)│
                                           │  │ password_hash │
                                           │  │ expires_at    │
                                           │  │ is_active     │
                                           │  │ view_count    │
                                           │  │ created_at    │
                                           │  └──────────────┘
```

### 2.2 表定义

#### users

```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
```

#### projects

```typescript
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
```

#### tasks

```typescript
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  parentId: uuid('parent_id'),
  wbsCode: varchar('wbs_code', { length: 20 }),
  name: varchar('name', { length: 200 }).notNull(),
  startDate: date('start_date'),
  endDate: date('end_date'),
  duration: integer('duration').default(1),
  deliverable: text('deliverable'),
  assignee: varchar('assignee', { length: 100 }),
  priority: varchar('priority', { length: 20 }).default('medium'), // high | medium | low
  status: varchar('status', { length: 20 }).default('pending'),   // pending | in_progress | completed
  isMilestone: boolean('is_milestone').default(false),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
```

#### members

```typescript
export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  userId: uuid('user_id').references(() => users.id),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  role: varchar('role', { length: 50 }),
  phone: varchar('phone', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
})
```

#### shares

```typescript
export const shares = pgTable('shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  shareToken: varchar('share_token', { length: 32 }).notNull().unique(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true).notNull(),
  viewCount: integer('view_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})
```

### 2.3 关键设计决策

1. **members.user_id 可为 null** — 未注册用户也可作为项目成员被添加（只有 name/email）
2. **tasks.parent_id 自引用** — 保持现有树形结构，支持 WBS 层级
3. **tasks.is_milestone** — 标记里程碑节点，甘特图中显示为菱形标记
4. **shares.share_token** — 使用 nanoid 生成短 token（如 `abc123xyz`），不可猜测
5. **shares.password_hash** — 可选的分享密码保护
6. **所有主键使用 uuid** — 避免暴露业务信息

---

## 3. 用户认证

### 3.1 注册/登录流程

```
注册: POST /api/auth/register
  ├─ 输入: email + password + display_name
  ├─ 校验: email 格式 + password ≥ 8位 + email 不重复
  ├─ 处理: bcrypt hash(password, 12) → 存入 users 表
  └─ 返回: { accessToken, refreshToken, user }

登录: POST /api/auth/login
  ├─ 输入: email + password
  ├─ 校验: bcrypt compare
  └─ 返回: { accessToken, refreshToken, user }

刷新: POST /api/auth/refresh
  ├─ 输入: refresh_token (HttpOnly Cookie)
  └─ 返回: { accessToken }

登出: POST /api/auth/logout
  └─ 清除 HttpOnly Cookie
```

### 3.2 JWT 策略

| Token | 有效期 | 存储位置 | 用途 |
|-------|--------|---------|------|
| Access Token | 2 小时 | Pinia store (内存) | API 请求鉴权 |
| Refresh Token | 7 天 | HttpOnly Cookie | 刷新 Access Token |

### 3.3 认证中间件

```typescript
// server/middleware/auth.ts
export default defineEventHandler(async (event) => {
  const url = event.node.req.url
  if (!url?.startsWith('/api/')) return
  if (isPublicRoute(url)) return

  const token = extractBearerToken(event)
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const payload = verifyAccessToken(token)
  if (!payload) {
    throw createError({ statusCode: 401, statusMessage: 'Token expired' })
  }

  event.context.userId = payload.userId
})
```

公开路由（无需认证）：
- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/refresh`
- `/api/share/:token`
- `/api/health`

---

## 4. 只读分享功能

### 4.1 分享流程

```
创建分享:
1. 用户在项目页面点击"分享"按钮
2. 前端调用 POST /api/projects/:id/shares
   ├─ 可选参数: password, expiresIn (小时)
3. 后端生成 share_token (nanoid, 10位)
4. 返回分享链接: https://domain.com/share/{token}

查看分享:
1. 访问者打开 /share/:token
2. GET /api/share/:token → 返回项目+任务+成员数据
3. 如果有密码保护，前端弹出密码输入框
4. 渲染只读视图 (甘特图 + 任务列表)
5. 后端 view_count + 1

管理分享:
1. GET /api/projects/:id/shares → 列出所有分享
2. DELETE /api/projects/:id/shares/:shareId → 撤销分享 (is_active = false)
```

### 4.2 只读分享页面

`/share/:token` 页面特性：
- 甘特图只读展示（不可拖拽、不可编辑）
- 任务列表只读展示
- 项目基本信息展示
- 无编辑按钮、无 AI 助手、无设置入口
- 底部显示 "由 PLAN-Tools 创建"
- 支持密码保护（可选）

### 4.3 分享 API

```
POST   /api/projects/:id/shares        创建分享
GET    /api/projects/:id/shares        列出所有分享
DELETE /api/projects/:id/shares/:sid   撤销分享
GET    /api/share/:token               获取分享数据(无需认证)
POST   /api/share/:token/verify        验证分享密码(如有)
```

---

## 5. 前端架构改造

### 5.1 Store 改造

| Store | 改造方式 |
|-------|---------|
| projectStore | `saveToLocalStorage()` → `await $fetch('/api/projects/...')` |
| tasksStore | `saveToLocalStorage()` → `await $fetch('/api/projects/:id/tasks/...')` |
| chatStore | 不变，仍用 localStorage |
| uiStore | 不变，仍用 localStorage |
| authStore | 新增，管理 JWT 和用户状态 |

**改造原则**：
- Store 对外接口保持不变（`addTask`, `setProjectInfo` 等）
- 内部实现从 localStorage 改为 API 调用
- 增加 `loading` / `error` 状态
- 使用乐观更新：先更新本地状态，再同步 API

### 5.2 新增页面

| 路由 | 页面 | 说明 |
|------|------|------|
| `/login` | LoginPage | 登录 |
| `/register` | RegisterPage | 注册 |
| `/projects` | ProjectsPage | 项目列表（多项目管理） |
| `/share/:token` | ShareViewPage | 只读分享查看 |

### 5.3 路由守卫

```
未登录用户:
  ├─ /login, /register, /share/:token → 放行
  └─ 其他页面 → 重定向到 /login

已登录用户:
  ├─ /projects → 项目列表
  ├─ /workspace/:projectId → 工作区
  └─ /login, /register → 重定向到 /projects
```

### 5.4 数据迁移

现有 localStorage 数据迁移到数据库：

```
迁移流程:
1. 用户注册/登录后，前端检测 localStorage 中有旧数据
2. 弹出提示："检测到本地项目数据，是否同步到云端？"
3. 用户确认后，调用 POST /api/migrate/local-to-cloud
4. 后端批量创建 project + tasks + members
5. 迁移成功后清除 localStorage
6. 如果用户取消，保留本地数据，下次仍可迁移
```

---

## 6. API 设计

### 6.1 认证 API

```
POST /api/auth/register     注册
POST /api/auth/login        登录
POST /api/auth/refresh      刷新 Token
POST /api/auth/logout       登出
GET  /api/auth/me           获取当前用户信息
```

### 6.2 项目 API

```
GET    /api/projects              列出当前用户的所有项目
POST   /api/projects              创建项目
GET    /api/projects/:id          获取项目详情
PUT    /api/projects/:id          更新项目
DELETE /api/projects/:id          删除项目
```

### 6.3 任务 API

```
GET    /api/projects/:id/tasks           获取项目所有任务
POST   /api/projects/:id/tasks           创建任务
PUT    /api/projects/:id/tasks/:taskId   更新任务
DELETE /api/projects/:id/tasks/:taskId   删除任务
PUT    /api/projects/:id/tasks/reorder   批量调整排序
```

### 6.4 成员 API

```
GET    /api/projects/:id/members           获取项目成员
POST   /api/projects/:id/members           添加成员
PUT    /api/projects/:id/members/:memberId 更新成员
DELETE /api/projects/:id/members/:memberId 删除成员
```

### 6.5 分享 API

```
POST   /api/projects/:id/shares        创建分享
GET    /api/projects/:id/shares        列出所有分享
DELETE /api/projects/:id/shares/:sid   撤销分享
GET    /api/share/:token               获取分享数据(无需认证)
POST   /api/share/:token/verify        验证分享密码
```

### 6.6 迁移 API

```
POST /api/migrate/local-to-cloud   localStorage 数据迁移到云端
```

---

## 7. 开发计划

### Week 9-10: 数据库 + 用户系统

| Day | 任务 | 产出 |
|-----|------|------|
| D1 | Drizzle ORM 集成 + Schema 定义 | `src/server/db/` 目录，5 张表 schema |
| D2 | Migration + 种子数据 | `drizzle.config.ts`，初始 migration |
| D3 | 用户注册 API | `POST /api/auth/register` |
| D4 | 用户登录 API + JWT | `POST /api/auth/login`，auth middleware |
| D5 | 登录/注册前端页面 | `/login`，`/register` 页面 |
| D6 | authStore + 路由守卫 | 认证状态管理，页面保护 |
| D7 | Refresh token + 登出 | 完整认证闭环 |
| D8 | 本地数据迁移功能 | `POST /api/migrate/local-to-cloud` |
| D9 | 集成测试 | 注册→登录→迁移→查看数据 |
| D10 | Bug 修复 + 优化 | 边界情况处理 |

### Week 11-12: 项目 CRUD + 多项目管理

| Day | 任务 | 产出 |
|-----|------|------|
| D11 | 项目 CRUD API | `GET/POST/PUT/DELETE /api/projects` |
| D12 | projectStore 改造 | localStorage → API 调用 |
| D13 | 任务 CRUD API | `GET/POST/PUT/DELETE /api/projects/:id/tasks` |
| D14 | tasksStore 改造 | localStorage → API 调用，乐观更新 |
| D15 | 成员 CRUD API + Store | members 关联用户 |
| D16 | 项目列表页 | `/projects` 多项目管理 |
| D17 | workspace 页面改造 | 从单项目 → 多项目切换 |
| D18 | 数据同步 + 冲突处理 | 离线提示，版本控制 |
| D19 | 集成测试 | 完整 CRUD 流程 |
| D20 | Bug 修复 + 优化 | 性能和体验 |

### Week 13-14: 分享功能 + 高级 AI

| Day | 任务 | 产出 |
|-----|------|------|
| D21 | 分享 API | 创建/列出/撤销分享 |
| D22 | 只读分享页面 | `/share/:token` |
| D23 | 分享管理 UI | 项目设置中的分享管理 |
| D24 | AI 调用统计 | 记录每次 AI 调用的 token 数 |
| D25 | AI 配额管理 | 每日/每月调用限制 |
| D26 | 自定义 Prompt | 用户可自定义 AI Prompt 模板 |
| D27 | 模板市场基础 | 公共模板浏览 + 导入 |
| D28 | 集成测试 | 分享 + AI 功能测试 |

### Week 15-16: 测试 + 优化 + 发布

| Day | 任务 | 产出 |
|-----|------|------|
| D29 | E2E 测试 | Playwright 自动化测试 |
| D30 | 安全测试 | SQL 注入、XSS、CSRF 防护验证 |
| D31 | 性能优化 | 查询优化、缓存策略、懒加载 |
| D32 | Docker 更新 | docker-compose 加入 PostgreSQL |
| D33 | 文档更新 | README、API 文档、部署文档 |
| D34 | Go/No-Go 检查 | 发布检查点 |
| D35 | 发布 | v0.4.0 tag + GitHub Release |

### 里程碑

```
Week 10: v0.4.0-alpha  — 数据库 + 用户系统
Week 12: v0.4.0-beta   — 项目 CRUD + 多项目
Week 14: v0.4.0-rc     — 分享 + 高级 AI
Week 16: v0.4.0        — 正式发布
```

---

## 8. Go/No-Go 发布检查点

| 检查项 | Go 条件 |
|--------|---------|
| 用户注册/登录 | 注册、登录、登出流程正常 |
| 数据持久化 | 项目/任务/成员数据正确存入 PostgreSQL |
| 数据迁移 | localStorage 数据可一键迁移到云端 |
| 多项目管理 | 可创建、切换、删除多个项目 |
| 只读分享 | 分享链接可正常访问，只读不可编辑 |
| 分享密码 | 密码保护的分享链接需输入密码才能查看 |
| AI 功能 | AI 功能在登录状态下正常使用 |
| AI 降级 | 未配置 API Key 时非 AI 功能正常 |
| 安全 | API Key 不泄露，SQL 注入/XSS 防护 |
| Docker | docker-compose up 一键启动含 PostgreSQL |
| 响应时间 | 页面加载 < 3 秒，API 响应 < 500ms |
