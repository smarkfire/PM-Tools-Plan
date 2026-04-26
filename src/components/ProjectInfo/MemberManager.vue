<template>
  <div class="member-manager">
    <!-- Members Table -->
    <el-table
      :data="members"
      stripe
      border
      style="width: 100%"
      @selection-change="handleSelectionChange"
      :empty-text="$t('project.members.table.empty')"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column type="index" :label="$t('project.members.table.index')" width="60" />
      <el-table-column prop="name" :label="$t('project.members.table.name')" min-width="120">
        <template #default="{ row }">
          <el-input
            v-if="row.editing"
            v-model="row.name"
            size="small"
            :placeholder="$t('project.members.form.namePlaceholder')"
          />
          <span v-else>{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="phone" :label="$t('project.members.table.phone')" min-width="140">
        <template #default="{ row }">
          <el-input
            v-if="row.editing"
            v-model="row.phone"
            size="small"
            :placeholder="$t('project.members.form.phonePlaceholder')"
          />
          <span v-else>{{ row.phone }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="email" :label="$t('project.members.table.email')" min-width="180">
        <template #default="{ row }">
          <el-input
            v-if="row.editing"
            v-model="row.email"
            size="small"
            :placeholder="$t('project.members.form.emailPlaceholder')"
          />
          <span v-else>{{ row.email }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="role" :label="$t('project.members.table.role')" min-width="120">
        <template #default="{ row }">
          <el-select
            v-if="row.editing"
            v-model="row.role"
            size="small"
            :placeholder="$t('project.members.form.rolePlaceholder')"
            style="width: 100%"
          >
            <el-option
              v-for="(label, value) in roleOptions"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
          <span v-else>{{ row.role }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('project.members.table.actions')" width="160" fixed="right">
        <template #default="{ row, $index }">
          <template v-if="row.editing">
            <el-button type="success" size="small" @click="handleSaveRow(row)">
              <i class="fa fa-check"></i>
            </el-button>
            <el-button size="small" @click="handleCancelEdit(row)">
              <i class="fa fa-times"></i>
            </el-button>
          </template>
          <template v-else>
            <el-button type="primary" size="small" @click="handleEditRow(row)">
              <i class="fa fa-edit"></i>
            </el-button>
            <el-button type="danger" size="small" @click="handleDeleteRow($index)">
              <i class="fa fa-trash"></i>
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- Bulk Actions -->
    <div class="mt-4 flex items-center justify-between" v-if="members.length > 0">
      <div>
        <el-button
          type="danger"
          size="small"
          :disabled="selectedMembers.length === 0"
          @click="handleDeleteSelected"
        >
          <i class="fa fa-trash mr-1"></i>
          {{ $t('project.members.messages.deleteSelected', { count: selectedMembers.length }) }}
        </el-button>
      </div>
      <div class="text-text-secondary text-sm">
        {{ $t('project.members.messages.totalMembers', { count: members.length }) }}
      </div>
    </div>

    <!-- Add Member Form (Inline) -->
    <div class="mt-4 pt-4 border-t">
      <div class="text-sm font-bold mb-2">{{ $t('project.members.messages.quickAdd') }}</div>
      <el-form :model="newMember" :rules="memberRules" ref="memberFormRef" inline>
        <el-form-item prop="name">
          <el-input
            v-model="newMember.name"
            :placeholder="$t('project.members.form.name')"
            style="width: 140px"
          />
        </el-form-item>
        <el-form-item prop="phone">
          <el-input
            v-model="newMember.phone"
            :placeholder="$t('project.members.form.phone')"
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item prop="email">
          <el-input
            v-model="newMember.email"
            :placeholder="$t('project.members.form.email')"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item prop="role">
          <el-select
            v-model="newMember.role"
            :placeholder="$t('project.members.form.role')"
            style="width: 140px"
          >
            <el-option
              v-for="(label, value) in roleOptions"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleAddMember">
            <i class="fa fa-plus mr-1"></i>
            {{ $t('common.buttons.add') }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useProjectStore } from '@/store/project'

const { t } = useI18n()
const projectStore = useProjectStore()
const memberFormRef = ref(null)
const selectedMembers = ref([])

const roleOptions = computed(() => ({
  [t('project.members.roles.projectManager')]: t('project.members.roles.projectManager'),
  [t('project.members.roles.productManager')]: t('project.members.roles.productManager'),
  [t('project.members.roles.techLead')]: t('project.members.roles.techLead'),
  [t('project.members.roles.developer')]: t('project.members.roles.developer'),
  [t('project.members.roles.tester')]: t('project.members.roles.tester'),
  [t('project.members.roles.designer')]: t('project.members.roles.designer'),
  [t('project.members.roles.other')]: t('project.members.roles.other')
}))

const newMember = reactive({
  name: '',
  phone: '',
  email: '',
  role: ''
})

const memberRules = computed(() => ({
  name: [
    { required: true, message: t('project.members.validation.nameRequired'), trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: t('project.members.validation.emailInvalid'), trigger: 'blur' }
  ]
}))

const members = computed({
  get: () => projectStore.project.members.map(m => ({ ...m, editing: false })),
  set: (value) => {
    projectStore.project.members = value
  }
})

onMounted(() => {
  // Load members from store on mount
  members.value = projectStore.project.members.map(m => ({ ...m, editing: false }))
})

const handleSelectionChange = (selection) => {
  selectedMembers.value = selection
}

const handleAddMember = () => {
  memberFormRef.value?.validate((valid) => {
    if (valid) {
      projectStore.addMember({ ...newMember })
      ElMessage.success(t('project.members.messages.addSuccess'))
      resetNewMember()
    } else {
      ElMessage.error(t('validation.required'))
    }
  })
}

const handleEditRow = (row) => {
  row.editing = true
  row._originalData = { ...row }
}

const handleSaveRow = (row) => {
  // Validate
  if (!row.name || row.name.trim() === '') {
    ElMessage.error(t('project.members.messages.nameRequired'))
    return
  }

  if (row.email && !isValidEmail(row.email)) {
    ElMessage.error(t('project.members.validation.emailInvalid'))
    return
  }

  projectStore.updateMember(row.id, {
    name: row.name,
    phone: row.phone,
    email: row.email,
    role: row.role
  })

  row.editing = false
  delete row._originalData
  ElMessage.success(t('project.members.messages.updateSuccess'))
}

const handleCancelEdit = (row) => {
  if (row._originalData) {
    Object.assign(row, row._originalData)
    delete row._originalData
  }
  row.editing = false
}

const handleDeleteRow = (index) => {
  ElMessageBox.confirm(
    t('project.members.messages.confirmDelete'),
    t('common.messages.confirmDelete'),
    {
      confirmButtonText: t('common.buttons.confirm'),
      cancelButtonText: t('common.buttons.cancel'),
      type: 'warning'
    }
  ).then(() => {
    const member = members.value[index]
    projectStore.deleteMember(member.id)
    ElMessage.success(t('project.members.messages.deleteSuccess'))
  }).catch(() => {
    // User cancelled
  })
}

const handleDeleteSelected = () => {
  if (selectedMembers.value.length === 0) {
    ElMessage.warning(t('project.members.messages.nameRequired'))
    return
  }

  ElMessageBox.confirm(
    t('project.members.messages.confirmDeleteMultiple', { count: selectedMembers.value.length }),
    t('common.messages.confirmDelete'),
    {
      confirmButtonText: t('common.buttons.confirm'),
      cancelButtonText: t('common.buttons.cancel'),
      type: 'warning'
    }
  ).then(() => {
    const ids = selectedMembers.value.map(m => m.id)
    projectStore.deleteMembers(ids)
    selectedMembers.value = []
    ElMessage.success(t('project.members.messages.deleteSuccess'))
  }).catch(() => {
    // User cancelled
  })
}

const resetNewMember = () => {
  Object.assign(newMember, {
    name: '',
    phone: '',
    email: '',
    role: ''
  })
  memberFormRef.value?.resetFields()
}

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
</script>

<style scoped>
.member-manager {
  width: 100%;
}

:deep(.el-table) {
  border-radius: 4px;
}

:deep(.el-form--inline .el-form-item) {
  margin-right: 10px;
  margin-bottom: 10px;
}
</style>
