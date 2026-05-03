<template>
  <div class="share-manager">
    <div class="share-header">
      <h3 class="share-title">分享设置</h3>
      <button class="btn-primary-sm" @click="createShare">
        <i class="fa fa-share-alt"></i> 创建分享链接
      </button>
    </div>

    <div v-if="loading" class="share-loading">加载中...</div>

    <div v-else-if="shares.length === 0" class="share-empty">
      还没有分享链接，点击上方按钮创建
    </div>

    <div v-else class="share-list">
      <div v-for="share in shares" :key="share.id" class="share-item">
        <div class="share-item-info">
          <div class="share-link-row">
            <code class="share-link">{{ getShareUrl(share.shareToken) }}</code>
            <button class="btn-icon" title="复制链接" @click="copyLink(share.shareToken)">
              <i class="fa fa-copy"></i>
            </button>
          </div>
          <div class="share-meta">
            <span v-if="share.passwordHash" class="share-badge">
              <i class="fa fa-lock"></i> 密码保护
            </span>
            <span class="share-badge">
              <i class="fa fa-eye"></i> {{ share.viewCount }} 次浏览
            </span>
            <span :class="['share-status', share.isActive ? 'active' : 'inactive']">
              {{ share.isActive ? '有效' : '已禁用' }}
            </span>
          </div>
        </div>
        <div class="share-item-actions">
          <button class="btn-icon" title="禁用/启用" @click="toggleShare(share)">
            <i :class="share.isActive ? 'fa fa-ban' : 'fa fa-check'"></i>
          </button>
          <button class="btn-icon btn-danger-icon" title="删除" @click="deleteShare(share.id)">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      </div>
    </div>

    <div v-if="showCreateForm" class="dialog-overlay" @click.self="showCreateForm = false">
      <div class="dialog-card">
        <h2 class="dialog-title">创建分享链接</h2>
        <div class="form-group">
          <label class="form-label">访问密码（可选）</label>
          <input v-model="newSharePassword" type="password" class="form-input" placeholder="留空则无需密码" />
        </div>
        <div class="dialog-actions">
          <button class="btn-secondary-sm" @click="showCreateForm = false">取消</button>
          <button class="btn-primary-sm" :disabled="creating" @click="confirmCreateShare">
            {{ creating ? '创建中...' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/store/auth'
import { useProjectStore } from '~/store/project'

const props = defineProps({
  projectId: { type: String, required: true },
})

const authStore = useAuthStore()
const config = useRuntimeConfig()

const shares = ref([])
const loading = ref(true)
const showCreateForm = ref(false)
const newSharePassword = ref('')
const creating = ref(false)

async function fetchShares() {
  loading.value = true
  try {
    shares.value = await $fetch(`/api/projects/${props.projectId}/shares`, {
      headers: authStore.getAuthHeaders(),
    })
  } catch (e) {
    console.error('Failed to fetch shares:', e)
  } finally {
    loading.value = false
  }
}

function getShareUrl(token) {
  const base = config.public.appUrl || window.location.origin
  return `${base}/share/${token}`
}

async function copyLink(token) {
  const url = getShareUrl(token)
  try {
    await navigator.clipboard.writeText(url)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = url
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

function createShare() {
  newSharePassword.value = ''
  showCreateForm.value = true
}

async function confirmCreateShare() {
  creating.value = true
  try {
    await $fetch(`/api/projects/${props.projectId}/shares`, {
      method: 'POST',
      headers: authStore.getAuthHeaders(),
      body: {
        password: newSharePassword.value || undefined,
      },
    })
    showCreateForm.value = false
    await fetchShares()
  } catch (e) {
    console.error('Failed to create share:', e)
  } finally {
    creating.value = false
  }
}

async function toggleShare(share) {
  try {
    await $fetch(`/api/projects/${props.projectId}/shares/${share.id}`, {
      method: 'DELETE',
      headers: authStore.getAuthHeaders(),
    })
    await fetchShares()
  } catch (e) {
    console.error('Failed to toggle share:', e)
  }
}

async function deleteShare(shareId) {
  try {
    await $fetch(`/api/projects/${props.projectId}/shares/${shareId}`, {
      method: 'DELETE',
      headers: authStore.getAuthHeaders(),
    })
    await fetchShares()
  } catch (e) {
    console.error('Failed to delete share:', e)
  }
}

onMounted(() => {
  fetchShares()
})
</script>

<style scoped>
.share-manager {
  padding: 1rem 0;
}

.share-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.share-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

.btn-primary-sm {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  background: #4285F4;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.8125rem;
  cursor: pointer;
}

.btn-primary-sm:hover:not(:disabled) { background: #3b78db; }
.btn-primary-sm:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-secondary-sm {
  padding: 0.375rem 0.875rem;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.8125rem;
  cursor: pointer;
}

.share-loading, .share-empty {
  text-align: center;
  padding: 2rem;
  color: #94a3b8;
  font-size: 0.875rem;
}

.share-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.share-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.share-link-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.share-link {
  font-size: 0.75rem;
  color: #4285F4;
  background: #eff6ff;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.share-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
  font-size: 0.75rem;
}

.share-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #64748b;
}

.share-status {
  font-weight: 500;
}

.share-status.active { color: #16a34a; }
.share-status.inactive { color: #dc2626; }

.share-item-actions {
  display: flex;
  gap: 0.25rem;
}

.btn-icon {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.375rem;
  border-radius: 4px;
  font-size: 0.8125rem;
}

.btn-icon:hover { background: #e2e8f0; color: #374151; }
.btn-danger-icon:hover { background: #fef2f2; color: #dc2626; }

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 2rem;
}

.dialog-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 380px;
  width: 100%;
}

.dialog-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.375rem;
}

.form-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.8125rem;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus { border-color: #4285F4; }

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
