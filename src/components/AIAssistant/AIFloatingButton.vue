<template>
  <div class="ai-float-button" :class="{ active: isOpen }" @click="handleClick">
    <el-icon :size="24">
      <ChatDotRound />
    </el-icon>
    <div class="tooltip">{{ t('ai.chat.tooltip') }}</div>
  </div>
</template>

<script setup lang="ts">
import { ChatDotRound } from '@element-plus/icons-vue'
import { useChatStore } from '~/store/chat'

const { t } = useI18n()
const chatStore = useChatStore()

const isOpen = computed(() => chatStore.isOpen)

const handleClick = () => {
  chatStore.toggleOpen()
}
</script>

<style scoped>
.ai-float-button {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
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
  z-index: 2000;
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
