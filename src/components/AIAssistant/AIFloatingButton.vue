<template>
  <div class="ai-float-container">
    <div v-if="isLoggedIn" class="ai-usage-badge" @click.stop="showStats = true">
      <el-icon :size="14"><DataAnalysis /></el-icon>
      <span class="badge-text">{{ remainingText }}</span>
    </div>
    <div class="ai-float-button" :class="{ active: isOpen }" @click="handleClick">
      <el-icon :size="24">
        <ChatDotRound />
      </el-icon>
      <div class="tooltip">{{ t('ai.chat.tooltip') }}</div>
    </div>
    <AIUsageStatsDialog v-model="showStats" />
  </div>
</template>

<script setup lang="ts">
import { ChatDotRound, DataAnalysis } from '@element-plus/icons-vue'
import { useChatStore } from '~/store/chat'
import { useAuthStore } from '~/store/auth'
import AIUsageStatsDialog from './AIUsageStatsDialog.vue'

const { t } = useI18n()
const chatStore = useChatStore()
const authStore = useAuthStore()

const isOpen = computed(() => chatStore.isOpen)
const isLoggedIn = computed(() => authStore.isAuthenticated)
const showStats = ref(false)

const remaining = ref(null)
const remainingText = computed(() => {
  if (remaining.value === null) return ''
  return `${remaining.value}`
})

const handleClick = () => {
  chatStore.toggleOpen()
}

onMounted(async () => {
  if (isLoggedIn.value) {
    try {
      const token = localStorage.getItem('auth_token')
      if (token) {
        const res = await fetch('/api/ai/usage', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          remaining.value = data.remainingToday
        }
      }
    } catch {}
  }
})
</script>

<style scoped>
.ai-float-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  z-index: 2000;
}

.ai-usage-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  font-size: 12px;
  color: #606266;
  transition: all 0.3s;
}

.ai-usage-badge:hover {
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  color: #409eff;
}

.badge-text {
  font-weight: 500;
}

.ai-float-button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.ai-float-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.6);
}

.ai-float-button.active {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

.tooltip {
  position: absolute;
  right: 64px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.ai-float-button:hover .tooltip {
  opacity: 1;
}
</style>
