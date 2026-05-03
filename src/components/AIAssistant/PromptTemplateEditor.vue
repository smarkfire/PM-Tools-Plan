<template>
  <el-dialog v-model="visible" :title="isEdit ? $t('ai.promptEditor.editTitle') : $t('ai.promptEditor.createTitle')" width="600px" @close="handleClose">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item :label="$t('ai.promptEditor.name')" prop="name">
        <el-input v-model="form.name" :placeholder="$t('ai.promptEditor.namePlaceholder')" maxlength="100" show-word-limit />
      </el-form-item>
      <el-form-item :label="$t('ai.promptEditor.category')" prop="category">
        <el-select v-model="form.category" style="width: 100%">
          <el-option :label="$t('ai.promptEditor.categoryGeneral')" value="general" />
          <el-option :label="$t('ai.promptEditor.categoryIndustry')" value="industry" />
          <el-option :label="$t('ai.promptEditor.categoryReport')" value="report" />
          <el-option :label="$t('ai.promptEditor.categoryChat')" value="chat" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('ai.promptEditor.description')" prop="description">
        <el-input v-model="form.description" type="textarea" :rows="2" :placeholder="$t('ai.promptEditor.descriptionPlaceholder')" maxlength="1000" />
      </el-form-item>
      <el-form-item label="Prompt" prop="systemPrompt">
        <el-input
          v-model="form.systemPrompt"
          type="textarea"
          :rows="10"
          :placeholder="$t('ai.promptEditor.systemPromptPlaceholder')"
          maxlength="5000"
          show-word-limit
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">{{ $t('ai.promptEditor.cancel') }}</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">{{ $t('ai.promptEditor.save') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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

const rules = computed(() => ({
  name: [{ required: true, message: t('ai.promptEditor.nameRequired'), trigger: 'blur' }],
  systemPrompt: [{ required: true, message: t('ai.promptEditor.promptRequired'), trigger: 'blur' }],
}))

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
      ElMessage.error(err.statusMessage || t('ai.promptEditor.saveFailed'))
    }
  } catch (e) {
    ElMessage.error(t('ai.promptEditor.saveFailed'))
  } finally {
    saving.value = false
  }
}

function handleClose() {
  visible.value = false
  form.value = { name: '', category: 'general', description: '', systemPrompt: '' }
}
</script>
