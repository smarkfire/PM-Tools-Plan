<template>
  <div ref="messagesRef" class="chat-messages">
    <div v-if="messages.length === 0" class="welcome-message">
      <div class="welcome-avatar">
        <el-icon :size="36" color="#667eea"><ChatDotRound /></el-icon>
      </div>
      <div class="welcome-content">
        <h4>{{ t('ai.chat.welcomeTitle') }}</h4>
        <p>{{ t('ai.chat.welcomeDesc') }}</p>
        <ul>
          <li>📊 {{ t('ai.chat.featureQuery') }}</li>
          <li>📅 {{ t('ai.chat.featureProgress') }}</li>
          <li>⚠️ {{ t('ai.chat.featureRisk') }}</li>
          <li>💡 {{ t('ai.chat.featureSuggest') }}</li>
        </ul>
        <p class="quick-label">{{ t('ai.chat.quickQuestions') }}</p>
        <div class="quick-questions">
          <el-tag
            v-for="question in quickQuestions"
            :key="question"
            effect="plain"
            class="quick-tag"
            @click="emit('quickQuestion', question)"
          >
            {{ question }}
          </el-tag>
        </div>
      </div>
    </div>

    <div
      v-for="(message, index) in messages"
      :key="index"
      class="message-item"
      :class="message.role"
    >
      <div class="message-avatar">
        <el-icon v-if="message.role === 'user'" :size="16"><User /></el-icon>
        <el-icon v-else :size="16" color="#667eea"><ChatDotRound /></el-icon>
      </div>
      <div class="message-content">
        <div v-if="message.role === 'assistant'" class="message-text markdown-body" v-html="renderMarkdown(message.content)"></div>
        <div v-else class="message-text user-text">{{ message.content }}</div>
        <div class="message-time">{{ formatTime(message.timestamp) }}</div>
      </div>
    </div>

    <div v-if="loading" class="typing-indicator">
      <div class="typing-avatar">
        <el-icon :size="16" color="#667eea"><ChatDotRound /></el-icon>
      </div>
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChatDotRound, User } from '@element-plus/icons-vue'
import { Marked } from 'marked'
import hljs from 'highlight.js'

const props = defineProps<{
  messages: Array<{ role: string; content: string; timestamp: string }>
  loading: boolean
}>()

const emit = defineEmits<{
  quickQuestion: [question: string]
}>()

const { t } = useI18n()
const messagesRef = ref<HTMLElement>()

const marked = new Marked({
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
      const highlighted = hljs.highlight(text, { language }).value
      return `<div class="code-block"><div class="code-header"><span class="code-lang">${language}</span><button class="code-copy" onclick="navigator.clipboard.writeText(this.closest('.code-block').querySelector('code').textContent)">复制</button></div><pre><code class="hljs language-${language}">${highlighted}</code></pre></div>`
    }
  },
  gfm: true,
  breaks: true
})

const quickQuestions = computed(() => [
  t('ai.chat.quickDelay'),
  t('ai.chat.quickHealth'),
  t('ai.chat.quickWorkload'),
  t('ai.chat.quickRisk'),
  t('ai.chat.quickWeekly'),
  t('ai.chat.quickReview')
])

watch(() => props.messages.length, () => {
  scrollToBottom()
})

watch(() => {
  if (props.messages.length > 0) {
    return props.messages[props.messages.length - 1].content
  }
  return ''
}, () => {
  scrollToBottom()
})

onMounted(() => {
  scrollToBottom()
})

const scrollToBottom = async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

const renderMarkdown = (content: string) => {
  if (!content) return ''
  try {
    return marked.parse(content) as string
  } catch {
    return content.replace(/\n/g, '<br>')
  }
}

const formatTime = (timestamp: string) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style>
@import 'highlight.js/styles/github-dark.css';
</style>

<style scoped>
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.welcome-message {
  text-align: center;
  padding: 24px 16px;
}

.welcome-avatar {
  margin-bottom: 12px;
}

.welcome-content h4 {
  margin: 0 0 8px;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.welcome-content p {
  margin: 4px 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.welcome-content ul {
  list-style: none;
  padding: 0;
  margin: 12px 0;
  text-align: left;
  display: inline-block;
}

.welcome-content ul li {
  font-size: 13px;
  padding: 2px 0;
  color: var(--el-text-color-regular);
}

.quick-label {
  margin-top: 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.quick-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 8px;
}

.quick-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.quick-tag:hover {
  color: #667eea;
  border-color: #667eea;
}

.message-item {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--el-fill-color-light);
}

.message-item.user .message-avatar {
  background: #667eea;
  color: white;
}

.message-content {
  max-width: 80%;
}

.message-text {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.message-item.assistant .message-text {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.user-text {
  background: #667eea;
  color: white;
  white-space: pre-wrap;
}

.message-time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-top: 4px;
}

.message-item.user .message-time {
  text-align: right;
}

.typing-indicator {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
}

.typing-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
}

.typing-dots {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
  animation: typing 1.4s infinite both;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>

<style>
.markdown-body {
  font-size: 14px;
  line-height: 1.7;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin: 12px 0 6px;
  font-weight: 600;
  line-height: 1.4;
}

.markdown-body h1 { font-size: 1.4em; }
.markdown-body h2 { font-size: 1.25em; }
.markdown-body h3 { font-size: 1.1em; }

.markdown-body p {
  margin: 6px 0;
}

.markdown-body ul,
.markdown-body ol {
  margin: 6px 0;
  padding-left: 20px;
}

.markdown-body ul { list-style-type: disc; }
.markdown-body ol { list-style-type: decimal; }

.markdown-body li {
  margin: 3px 0;
  line-height: 1.6;
}

.markdown-body li > ul,
.markdown-body li > ol {
  margin: 2px 0;
}

.markdown-body blockquote {
  margin: 8px 0;
  padding: 4px 12px;
  border-left: 3px solid #667eea;
  background: rgba(102, 126, 234, 0.06);
  border-radius: 0 4px 4px 0;
}

.markdown-body blockquote p {
  margin: 2px 0;
}

.markdown-body hr {
  margin: 12px 0;
  border: none;
  border-top: 1px solid var(--el-border-color-lighter);
}

.markdown-body a {
  color: #667eea;
  text-decoration: none;
}

.markdown-body a:hover {
  text-decoration: underline;
}

.markdown-body strong {
  font-weight: 600;
}

.markdown-body em {
  font-style: italic;
}

.markdown-body code {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 0.9em;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
}

.markdown-body .code-block {
  margin: 8px 0;
  border-radius: 6px;
  overflow: hidden;
  background: #1e1e2e;
}

.markdown-body .code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.markdown-body .code-lang {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
}

.markdown-body .code-copy {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  padding: 1px 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.markdown-body .code-copy:hover {
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.4);
}

.markdown-body .code-block pre {
  margin: 0;
  padding: 10px 14px;
  overflow-x: auto;
}

.markdown-body .code-block code {
  background: none;
  color: inherit;
  padding: 0;
  font-size: 13px;
  line-height: 1.5;
}

.markdown-body table {
  width: 100%;
  margin: 8px 0;
  border-collapse: collapse;
  font-size: 13px;
}

.markdown-body th,
.markdown-body td {
  padding: 6px 10px;
  border: 1px solid var(--el-border-color-lighter);
  text-align: left;
}

.markdown-body th {
  background: var(--el-fill-color-light);
  font-weight: 600;
}

.markdown-body tr:nth-child(even) {
  background: var(--el-fill-color-lighter);
}

.markdown-body img {
  max-width: 100%;
  border-radius: 4px;
}

.markdown-body input[type="checkbox"] {
  margin-right: 4px;
}
</style>
