<template>
  <el-dialog v-model="visible" title="AI 使用统计" width="600px" @close="handleClose">
    <div v-loading="loading" class="ai-usage-stats">
      <el-row :gutter="16" class="stats-overview">
        <el-col :span="8">
          <el-statistic title="今日已用" :value="stats.todayCalls">
            <template #suffix>/ {{ stats.dailyQuota }}</template>
          </el-statistic>
        </el-col>
        <el-col :span="8">
          <el-statistic title="今日剩余" :value="stats.remainingToday" />
        </el-col>
        <el-col :span="8">
          <el-statistic title="近30天调用" :value="stats.recentCalls30d" />
        </el-col>
      </el-row>

      <el-progress
        :percentage="dailyUsagePercent"
        :color="progressColor"
        :stroke-width="12"
        class="usage-progress"
      />

      <div v-if="stats.actionBreakdown?.length" class="action-breakdown">
        <h4>功能使用分布（近30天）</h4>
        <el-table :data="stats.actionBreakdown" size="small" stripe>
          <el-table-column prop="action" label="功能" />
          <el-table-column prop="count" label="调用次数" width="100" />
          <el-table-column prop="avgDuration" label="平均耗时(ms)" width="120" />
        </el-table>
      </div>

      <div v-if="stats.dailyUsage?.length" class="daily-usage">
        <h4>每日使用趋势（近30天）</h4>
        <div class="daily-chart">
          <div
            v-for="day in stats.dailyUsage.slice(0, 14)"
            :key="day.date"
            class="chart-bar"
            :style="{ height: barHeight(day.count) + '%' }"
            :title="`${day.date}: ${day.count}次`"
          >
            <span class="bar-label">{{ day.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const loading = ref(false)
const stats = ref({
  totalCalls: 0,
  recentCalls30d: 0,
  todayCalls: 0,
  dailyQuota: 50,
  remainingToday: 50,
  actionBreakdown: [],
  dailyUsage: [],
})

const dailyUsagePercent = computed(() => {
  if (!stats.value.dailyQuota) return 0
  return Math.min(100, Math.round((stats.value.todayCalls / stats.value.dailyQuota) * 100))
})

const progressColor = computed(() => {
  const pct = dailyUsagePercent.value
  if (pct >= 90) return '#F56C6C'
  if (pct >= 70) return '#E6A23C'
  return '#409EFF'
})

function barHeight(count) {
  const maxCount = Math.max(...stats.value.dailyUsage.map((d) => d.count), 1)
  return Math.max(5, (count / maxCount) * 100)
}

async function fetchStats() {
  loading.value = true
  try {
    const token = localStorage.getItem('auth_token')
    if (!token) return
    const res = await fetch('/api/ai/usage', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      stats.value = await res.json()
    }
  } catch (e) {
    console.error('Failed to fetch AI usage stats:', e)
  } finally {
    loading.value = false
  }
}

watch(visible, (val) => {
  if (val) fetchStats()
})

function handleClose() {
  visible.value = false
}
</script>

<style scoped>
.ai-usage-stats {
  padding: 8px 0;
}

.stats-overview {
  margin-bottom: 20px;
}

.usage-progress {
  margin-bottom: 24px;
}

.action-breakdown,
.daily-usage {
  margin-top: 20px;
}

.action-breakdown h4,
.daily-usage h4 {
  margin-bottom: 12px;
  font-size: 14px;
  color: #606266;
}

.daily-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 120px;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.chart-bar {
  flex: 1;
  min-width: 20px;
  background: #409eff;
  border-radius: 2px 2px 0 0;
  position: relative;
  transition: height 0.3s;
  cursor: pointer;
}

.chart-bar:hover {
  background: #66b1ff;
}

.bar-label {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: #909399;
  white-space: nowrap;
}
</style>
