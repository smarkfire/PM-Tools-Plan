<template>
  <div class="template-selector">
    <div v-if="loading" class="loading-state">加载中...</div>
    <div v-else class="template-grid">
      <div
        v-for="template in templates"
        :key="template.id"
        class="template-card"
        :class="{ active: selectedId === template.id }"
        @click="handleSelect(template)"
      >
        <div class="template-icon">{{ template.icon || '📋' }}</div>
        <div class="template-name">{{ template.name }}</div>
        <div class="template-desc">{{ template.description }}</div>
        <div class="template-info">
          <span>{{ (template.phases || []).length }} {{ t('ai.template.phases') }}</span>
          <span>{{ getTotalTasks(template) }} {{ t('ai.template.tasks') }}</span>
        </div>
      </div>
    </div>
    <div v-if="!loading" class="market-entry">
      <el-button text type="primary" @click="$emit('open-market')">
        🏪 浏览模板市场
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { industryTemplates, getTotalTasks } from '~/data/templates'

const { t } = useI18n()

const templates = ref(industryTemplates)
const selectedId = ref<string>()
const loading = ref(false)

const emit = defineEmits<{
  select: [template: any]
  'open-market': []
}>()

const handleSelect = (template: any) => {
  selectedId.value = template.id
  emit('select', template)
}

async function fetchTemplates() {
  loading.value = true
  try {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      templates.value = industryTemplates
      return
    }
    const res = await fetch('/api/templates/projects', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      if (data.length > 0) {
        templates.value = data
      } else {
        templates.value = industryTemplates
      }
    } else {
      templates.value = industryTemplates
    }
  } catch {
    templates.value = industryTemplates
  } finally {
    loading.value = false
  }
}

onMounted(fetchTemplates)
</script>

<style scoped>
.template-selector {
  padding: 0.5rem 0;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.template-card {
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.template-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.template-card.active {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
}

.template-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.template-name {
  font-size: 1rem;
  font-weight: 600;
  color: #303133;
  margin-bottom: 0.5rem;
}

.template-desc {
  font-size: 0.85rem;
  color: #909399;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.template-info {
  display: flex;
  justify-content: center;
  gap: 1rem;
  font-size: 0.8rem;
  color: #606266;
}

.template-info span {
  background: #f4f4f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.template-card.active .template-info span {
  background: #d9ecff;
  color: #409eff;
}

.market-entry {
  text-align: center;
  margin-top: 12px;
}

.loading-state {
  text-align: center;
  padding: 24px;
  color: var(--el-text-color-secondary);
}
</style>
