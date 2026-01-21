<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Todo, Group } from '../types'

const props = defineProps<{
  todo: Todo
  groups: Group[]
}>()

const emit = defineEmits<{
  toggle: [id: string]
  edit: [todo: Todo]
  delete: [id: string]
}>()

const isHovered = ref(false)
const isCompleting = ref(false)

// Due date status calculation
const dueDateStatus = computed(() => {
  if (!props.todo.due_date || props.todo.completed) {
    return null
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const dueDate = new Date(props.todo.due_date)
  dueDate.setHours(0, 0, 0, 0)
  
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return { type: 'overdue', label: `已逾期 ${Math.abs(diffDays)} 天`, days: diffDays }
  } else if (diffDays === 0) {
    return { type: 'today', label: '今天截止', days: 0 }
  } else if (diffDays <= 3) {
    return { type: 'warning', label: `${diffDays} 天后截止`, days: diffDays }
  } else {
    return { type: 'normal', label: `${diffDays} 天后截止`, days: diffDays }
  }
})

const groupStyle = computed(() => {
  if (props.todo.group_color) {
    return {
      backgroundColor: `${props.todo.group_color}20`,
      color: props.todo.group_color,
      borderColor: `${props.todo.group_color}40`,
    }
  }
  return {}
})

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatDueDate = (dateStr: string | null) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const handleToggle = () => {
  isCompleting.value = true
  setTimeout(() => {
    emit('toggle', props.todo.id)
    isCompleting.value = false
  }, 300)
}
</script>

<template>
  <div 
    class="todo-item"
    :class="{ 
      'completing': isCompleting, 
      'completed': todo.completed,
      'overdue': dueDateStatus?.type === 'overdue',
      'warning': dueDateStatus?.type === 'warning' || dueDateStatus?.type === 'today'
    }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="todo-checkbox">
      <label class="checkbox-wrapper">
        <input 
          type="checkbox" 
          :checked="!!todo.completed"
          @change="handleToggle"
        />
        <span class="checkbox-custom" :style="todo.group_color ? { borderColor: todo.group_color } : {}">
          <svg viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
      </label>
    </div>
    
    <div class="todo-content">
      <div class="todo-header">
        <h3 class="todo-title" :class="{ 'line-through': todo.completed }">
          {{ todo.title }}
        </h3>
        <!-- Due date status badge -->
        <span 
          v-if="dueDateStatus && !todo.completed" 
          class="due-status-badge"
          :class="dueDateStatus.type"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          {{ dueDateStatus.label }}
        </span>
      </div>
      <p v-if="todo.description" class="todo-description">
        {{ todo.description }}
      </p>
      <div class="todo-meta">
        <span 
          v-if="todo.group_name" 
          class="todo-group-badge"
          :style="groupStyle"
        >
          {{ todo.group_name }}
        </span>
        <span v-if="todo.due_date" class="todo-date due-date" :class="{ 'overdue': dueDateStatus?.type === 'overdue' }">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          截止: {{ formatDueDate(todo.due_date) }}
        </span>
        <span class="todo-date">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          创建: {{ formatDate(todo.created_at) }}
        </span>
        <span v-if="todo.completed_at" class="todo-date completed-date">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          完成: {{ formatDate(todo.completed_at) }}
        </span>
      </div>
    </div>
    
    <div class="todo-actions" :class="{ 'visible': isHovered }">
      <button class="btn btn-ghost btn-icon" @click="emit('edit', todo)" title="编辑">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
      <button class="btn btn-ghost btn-icon" @click="emit('delete', todo.id)" title="删除">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.todo-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: all var(--transition-normal);
  animation: slideIn var(--transition-normal);
}

.todo-item:hover {
  background: var(--color-bg-card-hover);
  border-color: var(--color-border-hover);
  transform: translateX(4px);
}

.todo-item.completing {
  opacity: 0.6;
  transform: scale(0.98);
}

.todo-item.completed {
  opacity: 0.7;
}

/* Overdue styling */
.todo-item.overdue {
  border-color: rgba(239, 68, 68, 0.5);
  background: rgba(239, 68, 68, 0.05);
}

.todo-item.overdue:hover {
  border-color: rgba(239, 68, 68, 0.7);
  background: rgba(239, 68, 68, 0.1);
}

/* Warning styling (about to expire) */
.todo-item.warning {
  border-color: rgba(245, 158, 11, 0.5);
  background: rgba(245, 158, 11, 0.05);
}

.todo-item.warning:hover {
  border-color: rgba(245, 158, 11, 0.7);
  background: rgba(245, 158, 11, 0.1);
}

.todo-checkbox {
  flex-shrink: 0;
  padding-top: 2px;
}

.todo-content {
  flex: 1;
  min-width: 0;
}

.todo-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-xs);
}

.todo-title {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
}

.todo-title.line-through {
  text-decoration: line-through;
  color: var(--color-text-muted);
}

/* Due status badge */
.due-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  border-radius: var(--radius-full);
  animation: pulse 2s infinite;
}

.due-status-badge.overdue {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  animation: none;
}

.due-status-badge.today {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.due-status-badge.warning {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.due-status-badge.normal {
  background: rgba(99, 102, 241, 0.2);
  color: #6366f1;
  animation: none;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.todo-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
  line-height: 1.5;
}

.todo-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
}

.todo-group-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: var(--font-size-xs);
  font-weight: 500;
  border-radius: var(--radius-full);
  border: 1px solid;
}

.todo-date {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.todo-date.due-date {
  color: var(--color-text-secondary);
}

.todo-date.due-date.overdue {
  color: #ef4444;
  font-weight: 500;
}

.completed-date {
  color: var(--color-success);
}

.todo-actions {
  display: flex;
  gap: var(--spacing-xs);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.todo-actions.visible {
  opacity: 1;
}

.todo-actions .btn-icon {
  color: var(--color-text-muted);
}

.todo-actions .btn-icon:hover {
  color: var(--color-text-primary);
}

.todo-actions .btn-icon:last-child:hover {
  color: var(--color-error);
}
</style>
