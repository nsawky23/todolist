<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Group, Stats } from '../types'
import WindowControls from './WindowControls.vue'

// Check if running on Windows
const isWindows = computed(() => navigator.userAgent.includes('Windows'))

const props = defineProps<{
  groups: Group[]
  stats: Stats
  activeTab: 'pending' | 'completed'
  selectedGroupId: string | null
}>()

const emit = defineEmits<{
  'update:activeTab': [tab: 'pending' | 'completed']
  'update:selectedGroupId': [id: string | null]
  addGroup: []
  editGroup: [group: Group]
  deleteGroup: [id: string]
  reorderGroups: [orderedIds: string[]]
}>()

// Drag and drop state
const draggedGroupId = ref<string | null>(null)
const dropTargetId = ref<string | null>(null)

const onDragStart = (id: string) => {
  draggedGroupId.value = id
}

const onDragOver = (e: DragEvent, id: string) => {
  e.preventDefault()
  if (draggedGroupId.value !== id) {
    dropTargetId.value = id
  }
}

const onDrop = (e: DragEvent, targetId: string) => {
  e.preventDefault()
  if (draggedGroupId.value && draggedGroupId.value !== targetId) {
    const newGroups = [...props.groups]
    const draggedIndex = newGroups.findIndex(g => g.id === draggedGroupId.value)
    const targetIndex = newGroups.findIndex(g => g.id === targetId)
    
    const [draggedGroup] = newGroups.splice(draggedIndex, 1)
    newGroups.splice(targetIndex, 0, draggedGroup)
    
    emit('reorderGroups', newGroups.map(g => g.id))
  }
  draggedGroupId.value = null
  dropTargetId.value = null
}

const onDragEnd = () => {
  draggedGroupId.value = null
  dropTargetId.value = null
}
</script>

<template>
  <aside class="sidebar">
    <!-- App Header -->
    <div class="sidebar-header drag-region">
      <WindowControls v-if="isWindows" />
      <div class="app-logo">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>待办清单</span>
      </div>
    </div>
    
    <!-- Stats -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-value">{{ stats.pending }}</div>
        <div class="stat-label">待完成</div>
      </div>
      <div class="stat-card completed">
        <div class="stat-value">{{ stats.completed }}</div>
        <div class="stat-label">已完成</div>
      </div>
    </div>
    
    <!-- Navigation -->
    <nav class="sidebar-nav">
      <h3 class="nav-title">视图</h3>
      <button 
        class="nav-item"
        :class="{ active: activeTab === 'pending' && !selectedGroupId }"
        @click="emit('update:activeTab', 'pending'); emit('update:selectedGroupId', null)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="9" x2="15" y2="15"></line>
          <line x1="15" y1="9" x2="9" y2="15"></line>
        </svg>
        <span>待办事项</span>
        <span class="nav-badge">{{ stats.pending }}</span>
      </button>
      <button 
        class="nav-item"
        :class="{ active: activeTab === 'completed' }"
        @click="emit('update:activeTab', 'completed'); emit('update:selectedGroupId', null)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>已完成</span>
        <span class="nav-badge">{{ stats.completed }}</span>
      </button>
    </nav>
    
    <!-- Groups -->
    <div class="groups-section">
      <div class="groups-header">
        <h3 class="nav-title">分组</h3>
        <button class="btn btn-ghost btn-icon no-drag" @click="emit('addGroup')" title="添加分组">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
      
      <div class="groups-list">
        <div 
          v-for="group in groups" 
          :key="group.id"
          class="group-item"
          :class="{ 
            active: selectedGroupId === group.id && activeTab === 'pending',
            dragging: draggedGroupId === group.id,
            'drop-target': dropTargetId === group.id
          }"
          draggable="true"
          @dragstart="onDragStart(group.id)"
          @dragover="onDragOver($event, group.id)"
          @drop="onDrop($event, group.id)"
          @dragend="onDragEnd"
          @click="emit('update:selectedGroupId', group.id); emit('update:activeTab', 'pending')"
        >
          <div class="drag-handle no-drag">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="19" r="1"></circle>
              <circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="19" r="1"></circle>
            </svg>
          </div>
          <span 
            class="group-color-dot"
            :style="{ backgroundColor: group.color }"
          ></span>
          <span class="group-name">{{ group.name }}</span>
          <div class="group-actions no-drag">
            <button 
              class="btn btn-ghost btn-icon small"
              @click.stop="emit('editGroup', group)"
              title="编辑"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button 
              class="btn btn-ghost btn-icon small"
              @click.stop="emit('deleteGroup', group.id)"
              title="删除"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="sidebar-footer">
      <p class="app-info">Todo List v1.0</p>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 280px;
  height: 100vh;
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: var(--spacing-lg);
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Mac: extra top padding for traffic lights */
:global(body.platform-mac) .sidebar-header {
  padding-top: 48px;
}

/* Windows: rounded corners for frameless window */
:global(body.platform-windows) .sidebar {
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
}

.app-logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-text-primary);
}

.app-logo svg {
  color: var(--color-accent);
}

.stats-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-sm);
  padding: 0 var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.stat-card {
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  text-align: center;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-accent);
}

.stat-card.completed .stat-value {
  color: var(--color-success);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-top: var(--spacing-xs);
}

.sidebar-nav {
  padding: 0 var(--spacing-md);
}

.nav-title {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: var(--spacing-sm) var(--spacing-sm);
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  font-family: inherit;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
}

.nav-item:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.nav-item.active {
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%);
  color: white;
}

.nav-item span:first-of-type {
  flex: 1;
}

.nav-badge {
  font-size: var(--font-size-xs);
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-full);
}

.nav-item.active .nav-badge {
  background: rgba(255, 255, 255, 0.2);
}

.groups-section {
  flex: 1;
  padding: var(--spacing-md);
  overflow-y: auto;
}

.groups-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.group-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  border: 1px solid transparent;
}

.group-item:hover {
  background: var(--color-bg-tertiary);
}

.group-item.active {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border-hover);
}

.group-item.dragging {
  opacity: 0.5;
  background: var(--color-bg-tertiary);
}

.group-item.drop-target {
  border-top: 2px solid var(--color-accent);
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  cursor: grab;
  padding: 4px;
  border-radius: 4px;
}

.drag-handle:hover {
  background: rgba(255, 255, 255, 0.05);
}

.group-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.group-name {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-item:hover .group-name,
.group-item.active .group-name {
  color: var(--color-text-primary);
}

.group-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.group-item:hover .group-actions {
  opacity: 1;
}

.group-actions .small {
  width: 24px;
  height: 24px;
  padding: 0;
}

.group-actions .btn-icon:last-child:hover {
  color: var(--color-error);
}

.sidebar-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.app-info {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-align: center;
}
</style>
