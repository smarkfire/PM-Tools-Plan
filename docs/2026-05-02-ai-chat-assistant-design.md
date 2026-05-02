# AI 问答助手设计文档

## 概述

为 PLAN-Tools 添加 AI 问答助手功能，用户可通过浮动按钮打开侧边抽屉式聊天界面，与 AI 进行项目相关的对话交互。首期实现核心查询功能：对话界面 + 项目状态查询（延期风险、成员负载、健康诊断）。

## 交互方式

- **浮动按钮**：右下角固定位置，点击打开/关闭侧边抽屉
- **侧边抽屉**：从右侧滑出，宽度 400px，包含完整聊天界面
- **流式响应**：AI 回复逐字显示，提升用户体验

## 模块设计

### 前端组件

| 组件 | 职责 |
|------|------|
| `AIFloatingButton.vue` | 右下角浮动按钮，点击切换抽屉开关 |
| `AIChatDrawer.vue` | 侧边抽屉容器，管理打开/关闭状态 |
| `AIChatMessages.vue` | 消息列表渲染（欢迎语、用户/AI消息、打字指示器） |
| `AIChatInput.vue` | 输入框 + 发送按钮 |

### 状态管理

`useChatStore` (Pinia)：
- `sessions`: 会话列表
- `currentSessionId`: 当前会话 ID
- `messages`: 当前会话消息列表
- `addMessage(role, content)`: 添加消息
- `clearHistory()`: 清空当前会话
- `createSession()`: 创建新会话
- 持久化到 localStorage，保留最近 100 条消息

### 后端 API

| API | 方法 | 说明 |
|-----|------|------|
| `/api/ai/chat-stream` | POST | SSE 流式聊天，注入项目上下文 |
| `/api/ai/analyze-delay-risk` | POST | 延期风险分析 |
| `/api/ai/analyze-workload` | POST | 成员负载分析 |
| `/api/ai/health-diagnosis` | POST | 项目健康诊断 |

### 工具函数

| 模块 | 职责 |
|------|------|
| `server/utils/ai/context-builder.ts` | 从项目/任务数据构建 system prompt |
| `server/utils/ai/stream.ts` | 流式响应工具函数 |

## 数据流

```
用户输入 → AIChatInput → chatStore.addMessage()
  → fetch('/api/ai/chat-stream', { messages, projectContext })
    → 服务端 context-builder 构建 system prompt
    → callAIStream() → SSE 逐 chunk 返回
  → 前端 ReadableStream 读取 → 逐字更新 AI 消息
```

## 项目上下文注入

前端发送请求时自动附带：
- 项目基本信息（名称、日期、描述）
- 任务摘要（总数、各状态数量、关键任务列表）
- 团队成员列表

服务端将这些信息注入 system prompt，使 AI 能理解当前项目状态。

## 流式响应实现

服务端：
- 设置 SSE 响应头（Content-Type: text/event-stream）
- 调用 Deepseek API 的 stream 模式
- 逐 chunk 发送 `data: { content: "..." }` 格式
- 结束发送 `data: [DONE]`

前端：
- 使用 `fetch` + `ReadableStream` 读取（支持 POST 请求）
- 逐字追加到 AI 消息内容
- 显示打字指示器动画

## 快捷问题

欢迎界面提供预设问题：
- "哪些任务可能延期？"
- "项目健康度如何？"
- "团队成员工作负载如何？"
- "帮我分析项目风险"

## i18n 支持

所有 UI 文本通过 i18n 管理，新增 `ai.chat.*` 命名空间。

## 后续迭代

- 操作执行功能（分配任务、修改状态等）
- 文档生成功能（周报、月报等）
- What-if 分析
- 对话历史搜索
