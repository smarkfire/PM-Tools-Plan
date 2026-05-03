<template>
  <el-dialog v-model="visible" :title="isEdit ? '编辑 Prompt 模板' : '创建 Prompt 模板'" width="600px" @close="handleClose">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" placeholder="如：建筑行业专家" maxlength="100" show-word-limit />
      </el-form-item>
      <el-form-item label="分类" prop="category">
        <el-select v-model="form.category" style="width: 100%">
          <el-option label="通用" value="general" />
          <el-option label="行业专家" value="industry" />
          <el-option label="报告生成" value="report" />
          <el-option label="对话助手" value="chat" />
        </el-select>
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input v-model="form.description" type="textarea" :rows="2" placeholder="简要描述模板用途" maxlength="1000" />
      </el-form-item>
      <el-form-item label="Prompt" prop="systemPrompt">
        <el-input
          v-model="form.systemPrompt"
          type="textarea"
          :rows="10"
          placeholder="输入 System Prompt 内容，将追加到 AI 的系统指令中"
          maxlength="5000"
          show-word-limit
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  template: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const isEdit = computed(() => !!props.template?.id)
const saving = ref(false)
const formRef = ref(null)

const form = ref({
  name: '',
  category: 'general',
  description: '',
  systemPrompt: '',
})

const rules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  systemPrompt: [{ required: true, message: '请输入 Prompt 内容', trigger: 'blur' }],
}

watch(() => props.template, (val) => {
  if (val) {
    form.value = {
      name: val.name || '',
      category: val.category || 'general',
      description: val.description || '',
      systemPrompt: val.systemPrompt || '',
    }
  } else {
    form.value = { name: '', category: 'general', description: '', systemPrompt: '' }
  }
}, { immediate: true })

async function handleSave() {
  if (!formRef.value) return
  await formRef.value.validate()
  saving.value = true
  try {
    const token = localStorage.getItem('auth_token')
    const url = isEdit.value ? `/api/templates/prompts/${props.template.id}` : '/api/templates/prompts'
    const method = isEdit.value ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form.value),
    })
    if (res.ok) {
      const data = await res.json()
      emit('saved', data)
      handleClose()
    } else {
      const err = await res.json()
      ElMessage.error(err.statusMessage || '保存失败')
    }
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

function handleClose() {
  visible.value = false
  form.value = { name: '', category: 'general', description: '', systemPrompt: '' }
}
</script>
