<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Group } from '../types'

const props = defineProps<{
  group?: Group | null
}>()

const emit = defineEmits<{
  save: [data: { name: string; color: string }]
  cancel: []
}>()

const name = ref('')
const color = ref('#6366f1')

const presetColors = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
]

onMounted(() => {
  if (props.group) {
    name.value = props.group.name
    color.value = props.group.color
  }
})

const handleSubmit = () => {
  if (!name.value.trim()) return
  
  emit('save', {
    name: name.value.trim(),
    color: color.value,
  })
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('cancel')">
    <div class="modal group-modal">
      <h2 class="modal-title">
        {{ group ? '编辑分组' : '新建分组' }}
      </h2>
      
      <form @submit.prevent="handleSubmit" class="group-form">
        <div class="form-group">
          <label class="form-label" for="name">分组名称 *</label>
          <input
            id="name"
            v-model="name"
            type="text"
            class="input"
            placeholder="输入分组名称..."
            autofocus
            required
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">分组颜色</label>
          <div class="color-picker">
            <div class="preset-colors">
              <button
                v-for="presetColor in presetColors"
                :key="presetColor"
                type="button"
                class="color-btn"
                :class="{ active: color === presetColor }"
                :style="{ backgroundColor: presetColor }"
                @click="color = presetColor"
              >
                <svg v-if="color === presetColor" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
            </div>
            <div class="custom-color">
              <label class="custom-color-label">
                <span>自定义颜色</span>
                <input 
                  type="color" 
                  v-model="color"
                  class="color-input"
                />
              </label>
              <div 
                class="color-preview"
                :style="{ backgroundColor: color }"
              >
                {{ color }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="preview-section">
          <label class="form-label">预览</label>
          <div class="preview-badge" :style="{ 
            backgroundColor: `${color}20`,
            color: color,
            borderColor: `${color}40`
          }">
            {{ name || '分组名称' }}
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="emit('cancel')">
            取消
          </button>
          <button type="submit" class="btn btn-primary" :disabled="!name.trim()">
            {{ group ? '保存' : '创建' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.group-modal {
  max-width: 420px;
}

.modal-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-primary);
}

.group-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.color-picker {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.preset-colors {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.color-btn {
  width: 36px;
  height: 36px;
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all var(--transition-fast);
}

.color-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.color-btn.active {
  border-color: white;
  box-shadow: 0 0 0 2px var(--color-bg-secondary), 0 0 0 4px currentColor;
}

.custom-color {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.custom-color-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.color-input {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  background: transparent;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-input::-webkit-color-swatch {
  border: none;
  border-radius: var(--radius-sm);
}

.color-preview {
  padding: 4px 12px;
  font-size: var(--font-size-xs);
  font-family: monospace;
  color: white;
  border-radius: var(--radius-sm);
}

.preview-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.preview-badge {
  display: inline-flex;
  align-self: flex-start;
  padding: 6px 16px;
  font-size: var(--font-size-sm);
  font-weight: 500;
  border: 1px solid;
  border-radius: var(--radius-full);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}
</style>
