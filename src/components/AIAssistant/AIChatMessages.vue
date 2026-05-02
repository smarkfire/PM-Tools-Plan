<template>
  <div class="chat-messages" ref="messagesContainer">
    <div v-if="messages.length === 0" class="empty-state">
      <el-icon :size="48" color="#c0c4cc"><ChatDotRound /></el-icon>
      <p>{{ t('ai.chat.emptyMessage') }}</p>
      <div class="quick-actions">
        <el-button
          v-for="action in quickActions"
          :key="action.key"
          size="small"
          round
          @click="$emit('quickAction', action.key)"
        >
          {{ action.label }}
        </el-button>
      </div>
    </div>
    <div
      v-for="(msg, index) in messages"
      :key="index"
      class="message-item"
      :class="msg.role"
    >
      <div class="message-avatar">
        <el-avatar v-if="msg.role === 'user'" :size="28" icon="User" />
        <el-avatar v-else :size="28" style="background: linear-gradient(135deg, #667eea, #764ba2);">
          <el-icon><Cpu /></el-icon>
        </el-avatar>
      </div>
      <div class="message-content">
        <div class="message-role">{{ msg.role === 'user' ? t('ai.chat.you') : 'AI' }}</div>
        <div
          v-if="msg.role === 'assistant'"
          class="message-text markdown-body"
          v-html="renderMarkdown(msg.content)"
        />
        <div v-else class="message-text">{{ msg.content }}</div>
      </div>
    </div>
    <div v-if="loading" class="message-item assistant">
      <div class="message-avatar">
        <el-avatar :size="28" style="background: linear-gradient(135deg, #667eea, #764ba2);">
          <el-icon><Cpu /></el-icon>
        </el-avatar>
      </div>
      <div class="message-content">
        <div class="message-role">AI</div>
        <div class="message-text typing">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChatDotRound, Cpu } from '@element-plus/icons-vue'
import { Marked } from 'marked'
import hljs from 'highlight.js'

const props = defineProps<{
  messages: Array<{ role: string; content: string }>
  loading: boolean
}>()

defineEmits<{
  quickAction: [key: string]
}>()

const { t } = useI18n()
const messagesContainer = ref<HTMLElement>()

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

const renderMarkdown = (content: string) => {
  if (!content) return ''
  try {
    return marked.parse(content) as string
  } catch {
    return content.replace(/\n/g, '<br>')
  }
}

const quickActions = computed(() => [
  { key: 'progress', label: t('ai.chat.quickProgress') },
  { key: 'risk', label: t('ai.chat.quickRisk') },
  { key: 'workload', label: t('ai.chat.quickWorkload') },
  { key: 'suggestion', label: t('ai.chat.quickSuggestion') }
])

watch(() => props.messages.length, () => {
  nextTick(() => scrollToBottom())
})

watch(() => {
  const lastMsg = props.messages[props.messages.length - 1]
  return lastMsg?.content?.length
}, () => {
  nextTick(() => scrollToBottom())
})

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped>
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: var(--el-text-color-secondary);
}

.empty-state p {
  font-size: 14px;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 8px;
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
  flex-shrink: 0;
}

.message-content {
  max-width: 80%;
}

.message-item.user .message-content {
  text-align: right;
}

.message-role {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.message-text {
  font-size: 14px;
  line-height: 1.6;
  padding: 8px 12px;
  border-radius: 8px;
  word-break: break-word;
}

.message-item.user .message-text {
  background: var(--el-color-primary-light-3);
  color: white;
  border-radius: 12px 12px 2px 12px;
}

.message-item.assistant .message-text {
  background: var(--el-fill-color-light);
  border-radius: 12px 12px 12px 2px;
}

.message-text.markdown-body :deep(p) {
  margin: 0 0 8px 0;
}

.message-text.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}

.message-text.markdown-body :deep(ul),
.message-text.markdown-body :deep(ol) {
  padding-left: 20px;
  margin: 4px 0;
}

.message-text.markdown-body :deep(li) {
  margin: 2px 0;
}

.message-text.markdown-body :deep(strong) {
  font-weight: 600;
}

.message-text.markdown-body :deep(.code-block) {
  margin: 8px 0;
  border-radius: 6px;
  overflow: hidden;
  background: #1e1e1e;
}

.message-text.markdown-body :deep(.code-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 12px;
}

.message-text.markdown-body :deep(.code-lang) {
  color: #ccc;
}

.message-text.markdown-body :deep(.code-copy) {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ccc;
  padding: 2px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

.message-text.markdown-body :deep(.code-copy:hover) {
  background: rgba(255, 255, 255, 0.1);
}

.message-text.markdown-body :deep(pre) {
  margin: 0;
  padding: 12px;
  overflow-x: auto;
}

.message-text.markdown-body :deep(code) {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}

.message-text.markdown-body :deep(:not(pre) > code) {
  background: rgba(0, 0, 0, 0.06);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 13px;
}

.message-text.markdown-body :deep(table) {
  border-collapse: collapse;
  margin: 8px 0;
  width: 100%;
}

.message-text.markdown-body :deep(th),
.message-text.markdown-body :deep(td) {
  border: 1px solid var(--el-border-color);
  padding: 6px 10px;
  text-align: left;
}

.message-text.markdown-body :deep(th) {
  background: var(--el-fill-color);
}

.message-text.markdown-body :deep(blockquote) {
  border-left: 3px solid var(--el-color-primary);
  padding-left: 12px;
  margin: 8px 0;
  color: var(--el-text-color-secondary);
}

.typing {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
}

.typing .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-text-color-secondary);
  animation: typing 1.4s infinite;
}

.typing .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}
</style>
