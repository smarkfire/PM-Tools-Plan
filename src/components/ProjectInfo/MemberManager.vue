<template>
  <div class="member-manager">
    <!-- Members Table -->
    <el-table
      :data="members"
      stripe
      border
      style="width: 100%"
      @selection-change="handleSelectionChange"
      empty-text="暂无项目人员，请点击新增人员添加"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="name" label="姓名" min-width="120">
        <template #default="{ row }">
          <el-input
            v-if="row.editing"
            v-model="row.name"
            size="small"
            placeholder="请输入姓名"
          />
          <span v-else>{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="电话" min-width="140">
        <template #default="{ row }">
          <el-input
            v-if="row.editing"
            v-model="row.phone"
            size="small"
            placeholder="请输入电话"
          />
          <span v-else>{{ row.phone }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="email" label="邮箱" min-width="180">
        <template #default="{ row }">
          <el-input
            v-if="row.editing"
            v-model="row.email"
            size="small"
            placeholder="请输入邮箱"
          />
          <span v-else>{{ row.email }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="role" label="角色" min-width="120">
        <template #default="{ row }">
          <el-select
            v-if="row.editing"
            v-model="row.role"
            size="small"
            placeholder="请选择角色"
            style="width: 100%"
          >
            <el-option label="项目经理" value="项目经理" />
            <el-option label="产品经理" value="产品经理" />
            <el-option label="技术负责人" value="技术负责人" />
            <el-option label="开发工程师" value="开发工程师" />
            <el-option label="测试工程师" value="测试工程师" />
            <el-option label="UI设计师" value="UI设计师" />
            <el-option label="其他" value="其他" />
          </el-select>
          <span v-else>{{ row.role }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
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
          删除选中 ({{ selectedMembers.length }})
        </el-button>
      </div>
      <div class="text-text-secondary text-sm">
        共 {{ members.length }} 名人员
      </div>
    </div>

    <!-- Add Member Form (Inline) -->
    <div class="mt-4 pt-4 border-t">
      <div class="text-sm font-bold mb-2">快速添加人员</div>
      <el-form :model="newMember" :rules="memberRules" ref="memberFormRef" inline>
        <el-form-item prop="name">
          <el-input
            v-model="newMember.name"
            placeholder="姓名"
            style="width: 140px"
          />
        </el-form-item>
        <el-form-item prop="phone">
          <el-input
            v-model="newMember.phone"
            placeholder="电话"
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item prop="email">
          <el-input
            v-model="newMember.email"
            placeholder="邮箱"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item prop="role">
          <el-select
            v-model="newMember.role"
            placeholder="角色"
            style="width: 140px"
          >
            <el-option label="项目经理" value="项目经理" />
            <el-option label="产品经理" value="产品经理" />
            <el-option label="技术负责人" value="技术负责人" />
            <el-option label="开发工程师" value="开发工程师" />
            <el-option label="测试工程师" value="测试工程师" />
            <el-option label="UI设计师" value="UI设计师" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleAddMember">
            <i class="fa fa-plus mr-1"></i>
            添加
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useProjectStore } from '@/store/project'

const projectStore = useProjectStore()
const memberFormRef = ref(null)
const selectedMembers = ref([])

const newMember = reactive({
  name: '',
  phone: '',
  email: '',
  role: ''
})

const memberRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

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
      ElMessage.success('人员添加成功')
      resetNewMember()
    } else {
      ElMessage.error('请检查表单填写是否正确')
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
    ElMessage.error('姓名不能为空')
    return
  }

  if (row.email && !isValidEmail(row.email)) {
    ElMessage.error('邮箱格式不正确')
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
  ElMessage.success('人员信息更新成功')
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
    '确定要删除该人员吗？',
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const member = members.value[index]
    projectStore.deleteMember(member.id)
    ElMessage.success('人员删除成功')
  }).catch(() => {
    // User cancelled
  })
}

const handleDeleteSelected = () => {
  if (selectedMembers.value.length === 0) {
    ElMessage.warning('请先选择要删除的人员')
    return
  }

  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedMembers.value.length} 名人员吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const ids = selectedMembers.value.map(m => m.id)
    projectStore.deleteMembers(ids)
    selectedMembers.value = []
    ElMessage.success('人员删除成功')
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
