<template>
  <div v-loading="loading" class="ai-usage-overview">
    <el-row :gutter="16">
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-value">{{ stats.todayCalls }}</div>
          <div class="stat-label">{{ $t('ai.usage.todayUsed') }}</div>
          <div class="stat-sub">{{ $t('ai.usage.dailyQuota', { quota: stats.dailyQuota }) }}</div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-value" :class="{ warning: stats.remainingToday <= 5, danger: stats.remainingToday === 0 }">
            {{ stats.remainingToday }}
          </div>
          <div class="stat-label">{{ $t('ai.usage.todayRemaining') }}</div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-value">{{ stats.recentCalls30d }}</div>
          <div class="stat-label">{{ $t('ai.usage.recent30d') }}</div>
        </div>
      </el-col>
    </el-row>

    <el-progress
      :percentage="dailyUsagePercent"
      :color="progressColor"
      :stroke-width="10"
      class="usage-progress"
    />

    <div v-if="stats.actionBreakdown?.length" class="action-breakdown">
      <el-table :data="stats.actionBreakdown" size="small" stripe>
        <el-table-column prop="action" :label="$t('ai.usage.feature')" />
        <el-table-column prop="count" :label="$t('ai.usage.callCount')" width="100" />
        <el-table-column prop="avgDuration" :label="$t('ai.usage.avgDuration')" width="120" />
      </el-table>
    </div>

    <div v-if="!loading && stats.todayCalls === 0" class="empty-hint">
      {{ $t('ai.usage.noData') }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const loading = ref(false)
const stats = ref({
  todayCalls: 0,
  dailyQuota: 50,
  remainingToday: 50,
  recentCalls30d: 0,
  actionBreakdown: [],
  dailyUsage: [],
})

const dailyUsagePercent = computed(() => {
  if (!stats.value.dailyQuota) return 0
  return Math.min(100, Math.round((stats.value.todayCalls / stats.value.dailyQuota) * 100))
})

const progressColor = computed(() => {
  const p = dailyUsagePercent.value
  if (p >= 90) return '#F56C6C'
  if (p >= 70) return '#E6A23C'
  return '#409EFF'
})

onMounted(async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('auth_token')
    if (!token) return
    const res = await fetch('/api/ai/usage', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      stats.value = { ...stats.value, ...data }
    }
  } catch {
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.ai-usage-overview {
  padding: 0;
}

.stat-card {
  text-align: center;
  padding: 16px 8px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--el-color-primary);
  line-height: 1.2;
}

.stat-value.warning {
  color: var(--el-color-warning);
}

.stat-value.danger {
  color: var(--el-color-danger);
}

.stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.stat-sub {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-top: 2px;
}

.usage-progress {
  margin-top: 16px;
}

.action-breakdown {
  margin-top: 16px;
}

.empty-hint {
  text-align: center;
  padding: 24px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
