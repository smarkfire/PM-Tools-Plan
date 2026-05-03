import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  integer,
  boolean,
  timestamp,
  index,
  jsonb,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  members: many(members),
  shares: many(shares),
}))

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('projects_owner_id_idx').on(table.ownerId),
  index('projects_updated_at_idx').on(table.updatedAt),
])

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  tasks: many(tasks),
  members: many(members),
  shares: many(shares),
}))

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .notNull(),
  parentId: uuid('parent_id'),
  wbsCode: varchar('wbs_code', { length: 20 }),
  name: varchar('name', { length: 200 }).notNull(),
  startDate: date('start_date'),
  endDate: date('end_date'),
  duration: integer('duration').default(1),
  deliverable: text('deliverable'),
  assignee: varchar('assignee', { length: 100 }),
  priority: varchar('priority', { length: 20 }).default('medium'),
  status: varchar('status', { length: 20 }).default('pending'),
  isMilestone: boolean('is_milestone').default(false),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('tasks_project_id_idx').on(table.projectId),
  index('tasks_parent_id_idx').on(table.parentId),
  index('tasks_sort_order_idx').on(table.projectId, table.sortOrder),
])

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  parent: one(tasks, {
    fields: [tasks.parentId],
    references: [tasks.id],
    relationName: 'taskHierarchy',
  }),
  children: many(tasks, {
    relationName: 'taskHierarchy',
  }),
}))

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  role: varchar('role', { length: 50 }),
  phone: varchar('phone', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('members_project_id_idx').on(table.projectId),
])

export const membersRelations = relations(members, ({ one }) => ({
  project: one(projects, {
    fields: [members.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
}))

export const shares = pgTable('shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .notNull(),
  shareToken: varchar('share_token', { length: 32 }).notNull().unique(),
  createdBy: uuid('created_by')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true).notNull(),
  viewCount: integer('view_count').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('shares_project_id_idx').on(table.projectId),
  index('shares_share_token_idx').on(table.shareToken),
])

export const sharesRelations = relations(shares, ({ one }) => ({
  project: one(projects, {
    fields: [shares.projectId],
    references: [projects.id],
  }),
  creator: one(users, {
    fields: [shares.createdBy],
    references: [users.id],
  }),
}))

export const aiUsageLogs = pgTable('ai_usage_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  model: varchar('model', { length: 50 }),
  tokenInput: integer('token_input').default(0),
  tokenOutput: integer('token_output').default(0),
  durationMs: integer('duration_ms').default(0),
  success: boolean('success').default(true).notNull(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('ai_usage_logs_user_id_idx').on(table.userId),
  index('ai_usage_logs_created_at_idx').on(table.createdAt),
  index('ai_usage_logs_action_idx').on(table.action),
])

export const aiUsageLogsRelations = relations(aiUsageLogs, ({ one }) => ({
  user: one(users, {
    fields: [aiUsageLogs.userId],
    references: [users.id],
  }),
}))

export const promptTemplates = pgTable('prompt_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  systemPrompt: text('system_prompt').notNull(),
  category: varchar('category', { length: 50 }).notNull().default('general'),
  isOfficial: boolean('is_official').notNull().default(false),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('prompt_templates_user_id_idx').on(table.userId),
  index('prompt_templates_category_idx').on(table.category),
  index('prompt_templates_is_official_idx').on(table.isOfficial),
])

export const promptTemplatesRelations = relations(promptTemplates, ({ one }) => ({
  user: one(users, {
    fields: [promptTemplates.userId],
    references: [users.id],
  }),
}))

export const projectTemplates = pgTable('project_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  icon: varchar('icon', { length: 10 }),
  description: text('description'),
  industry: varchar('industry', { length: 50 }),
  phases: jsonb('phases').notNull().$type<Array<{ name: string; tasks: Array<{ name: string; duration: number; deliverable: string }> }>>(),
  linkedPromptId: uuid('linked_prompt_id').references(() => promptTemplates.id),
  isOfficial: boolean('is_official').notNull().default(false),
  usageCount: integer('usage_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('project_templates_user_id_idx').on(table.userId),
  index('project_templates_is_official_idx').on(table.isOfficial),
  index('project_templates_industry_idx').on(table.industry),
])

export const projectTemplatesRelations = relations(projectTemplates, ({ one }) => ({
  user: one(users, {
    fields: [projectTemplates.userId],
    references: [users.id],
  }),
  linkedPrompt: one(promptTemplates, {
    fields: [projectTemplates.linkedPromptId],
    references: [promptTemplates.id],
  }),
}))
