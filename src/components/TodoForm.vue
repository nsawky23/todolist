<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Todo, Group } from '../types'
import DatePicker from './DatePicker.vue'

const props = defineProps<{
  todo?: Todo | null
  groups: Group[]
}>()

const emit = defineEmits<{
  save: [data: { title: string; description: string; groupId: string | null; dueDate: string | null }]
  cancel: []
}>()

const title = ref('')
const description = ref('')
const groupId = ref<string | null>(null)
const dueDate = ref<string>('')

// Validation state
const titleTouched = ref(false)
const showTitleError = ref(false)

const titleError = computed(() => {
  if (!titleTouched.value && !showTitleError.value) return ''
  if (!title.value.trim()) return '请输入待办事项标题'
  return ''
})

onMounted(() => {
  if (props.todo) {
    title.value = props.todo.title
    description.value = props.todo.description
    groupId.value = props.todo.group_id
    if (props.todo.due_date) {
      dueDate.value = props.todo.due_date.split(' ')[0]
    }
  }
})

const handleTitleBlur = () => {
  titleTouched.value = true
}

const handleTitleInput = () => {
  // Clear error when user starts typing
  if (showTitleError.value && title.value.trim()) {
    showTitleError.value = false
  }
}

const handleSubmit = () => {
  // Validate title
  if (!title.value.trim()) {
    showTitleError.value = true
    // Shake animation trigger
    const titleInput = document.getElementById('title')
    titleInput?.classList.add('shake')
    setTimeout(() => titleInput?.classList.remove('shake'), 500)
    return
  }
  
  emit('save', {
    title: title.value.trim(),
    description: description.value.trim(),
    groupId: groupId.value,
    dueDate: dueDate.value || null,
  })
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('cancel')">
    <div class="modal todo-modal">
      <h2 class="modal-title">
        {{ todo ? '编辑待办事项' : '新建待办事项' }}
      </h2>
      
      <form @submit.prevent="handleSubmit" class="todo-form">
        <div class="form-group" :class="{ 'has-error': titleError }">
          <label class="form-label" for="title">
            标题 
            <span class="required">*</span>
          </label>
          <input
            id="title"
            v-model="title"
            type="text"
            class="input"
            :class="{ 'input-error': titleError }"
            placeholder="输入待办事项标题..."
            autofocus
            @blur="handleTitleBlur"
            @input="handleTitleInput"
          />
          <Transition name="error-fade">
            <div v-if="titleError" class="error-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {{ titleError }}
            </div>
          </Transition>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="description">描述</label>
          <textarea
            id="description"
            v-model="description"
            class="input textarea"
            placeholder="添加详细描述（可选）..."
            rows="3"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">截止日期</label>
          <DatePicker v-model="dueDate" />
          <p class="form-hint">可选，设置截止日期后将显示逾期提醒</p>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="group">分组</label>
          <select id="group" v-model="groupId" class="input select">
            <option :value="null">无分组</option>
            <option 
              v-for="group in groups" 
              :key="group.id" 
              :value="group.id"
            >
              {{ group.name }}
            </option>
          </select>
          <div class="group-colors">
            <button
              v-for="group in groups"
              :key="group.id"
              type="button"
              class="group-color-btn"
              :class="{ active: groupId === group.id }"
              :style="{ 
                backgroundColor: groupId === group.id ? group.color : 'transparent',
                borderColor: group.color,
                color: groupId === group.id ? 'white' : group.color
              }"
              @click="groupId = groupId === group.id ? null : group.id"
            >
              {{ group.name }}
            </button>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="emit('cancel')">
            取消
          </button>
          <button type="submit" class="btn btn-primary">
            {{ todo ? '保存' : '创建' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.todo-modal {
  max-width: 500px;
}

.modal-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-primary);
}

.todo-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-group.has-error .form-label {
  color: var(--color-error);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: color var(--transition-fast);
}

.required {
  color: var(--color-error);
}

.form-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-top: 4px;
}

/* Input error state */
.input-error {
  border-color: var(--color-error) !important;
  background: rgba(239, 68, 68, 0.05);
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2) !important;
}

/* Error message */
.error-message {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-xs);
  color: var(--color-error);
  padding: 6px 10px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--color-error);
}

.error-message svg {
  flex-shrink: 0;
}

/* Error animation */
.error-fade-enter-active,
.error-fade-leave-active {
  transition: all 0.2s ease;
}

.error-fade-enter-from,
.error-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Shake animation for invalid input */
:global(.shake) {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.group-colors {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.group-color-btn {
  padding: 6px 12px;
  font-size: var(--font-size-xs);
  font-weight: 500;
  border: 2px solid;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: inherit;
}

.group-color-btn:hover {
  transform: scale(1.05);
}

.group-color-btn.active {
  box-shadow: 0 0 10px currentColor;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}
</style>
