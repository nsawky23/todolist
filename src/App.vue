<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Todo, Group, Stats, TodoQueryOptions } from './types'
import Sidebar from './components/Sidebar.vue'
import TodoItem from './components/TodoItem.vue'
import TodoForm from './components/TodoForm.vue'
import GroupForm from './components/GroupForm.vue'

// State
const todos = ref<Todo[]>([])
const groups = ref<Group[]>([])
const stats = ref<Stats>({ total: 0, completed: 0, pending: 0 })

const activeTab = ref<'pending' | 'completed'>('pending')
const selectedGroupId = ref<string | null>(null)

// Advanced Query State
const sortOrder = ref<'asc' | 'desc'>('desc')
const isGrouped = ref(false)
const collapsedGroups = ref<Set<string | null>>(new Set())

// Completed Filter State
const startDate = ref('')
const endDate = ref('')
const hasMore = ref(false)
const totalCount = ref(0)
const limit = 200
const offset = ref(0)

// Modal states
const showTodoForm = ref(false)
const showGroupForm = ref(false)
const editingTodo = ref<Todo | null>(null)
const editingGroup = ref<Group | null>(null)

// Search
const searchQuery = ref('')

// Computed: Filter & Group TODOS
const processedTodos = computed(() => {
  let result = [...todos.value]
  
  // Filter by search query (client-side for better UX with search input)
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query)
    )
  }
  
  return result
})

// Grouped Structure
const groupedTodos = computed(() => {
  if (!isGrouped.value) return null
  
  const map = new Map<string | null, Todo[]>()
  
  // Initialize map with current groups to maintain order
  groups.value.forEach(g => map.set(g.id, []))
  map.set(null, []) // For todos without group
  
  processedTodos.value.forEach(todo => {
    const gid = todo.group_id
    if (map.has(gid)) {
      map.get(gid)!.push(todo)
    } else {
      map.set(gid, [todo])
    }
  })
  
  // Convert map to array and filter out empty groups if a specific group is selected
  return Array.from(map.entries())
    .map(([id, items]) => {
      const group = groups.value.find(g => g.id === id)
      return {
        id,
        name: group ? group.name : '无分组',
        color: group ? group.color : '#94a3b8',
        items
      }
    })
    .filter(g => g.items.length > 0)
})

const pageTitle = computed(() => {
  if (selectedGroupId.value) {
    const group = groups.value.find(g => g.id === selectedGroupId.value)
    return group ? group.name : '待办事项'
  }
  return activeTab.value === 'pending' ? '待办事项' : '已完成'
})

// Data loading functions
const loadGroups = async () => {
  groups.value = await window.api.groups.getAll()
}

const loadTodos = async (append = false) => {
  if (!append) offset.value = 0
  
  const options: TodoQueryOptions = {
    completed: activeTab.value === 'completed',
    groupId: selectedGroupId.value ?? undefined,
    sortOrder: sortOrder.value,
    startDate: startDate.value || undefined,
    endDate: endDate.value || undefined,
    limit,
    offset: offset.value
  }
  
  const result = await window.api.todos.query(options)
  
  if (append) {
    todos.value = [...todos.value, ...result.items]
  } else {
    todos.value = result.items
  }
  
  hasMore.value = result.hasMore
  totalCount.value = result.total
}

const loadMore = async () => {
  if (!hasMore.value) return
  offset.value += limit
  await loadTodos(true)
}

const loadStats = async () => {
  stats.value = await window.api.stats.get()
}

const refreshData = async () => {
  await Promise.all([loadGroups(), loadTodos(), loadStats()])
}

// Watchers
watch([activeTab, selectedGroupId, sortOrder, startDate, endDate], () => {
  loadTodos()
})

// UI Actions
const toggleGroupCollapse = (groupId: string | null) => {
  if (collapsedGroups.value.has(groupId)) {
    collapsedGroups.value.delete(groupId)
  } else {
    collapsedGroups.value.add(groupId)
  }
}

const handleReorderGroups = async (orderedIds: string[]) => {
  await window.api.groups.reorder(orderedIds)
  await loadGroups()
}

// Todo operations
const handleToggleTodo = async (id: string) => {
  await window.api.todos.toggleComplete(id)
  await refreshData()
}

const handleSaveTodo = async (data: { title: string; description: string; groupId: string | null; dueDate: string | null }) => {
  if (editingTodo.value) {
    await window.api.todos.update(
      editingTodo.value.id,
      data.title,
      data.description,
      data.groupId,
      data.dueDate
    )
  } else {
    await window.api.todos.create(data.title, data.description, data.groupId, data.dueDate)
  }
  
  showTodoForm.value = false
  editingTodo.value = null
  await refreshData()
}

const handleEditTodo = (todo: Todo) => {
  editingTodo.value = todo
  showTodoForm.value = true
}

const handleDeleteTodo = async (id: string) => {
  if (confirm('确定要删除这个待办事项吗？')) {
    await window.api.todos.delete(id)
    await refreshData()
  }
}

// Group operations
const handleAddGroup = () => {
  editingGroup.value = null
  showGroupForm.value = true
}

const handleEditGroup = (group: Group) => {
  editingGroup.value = group
  showGroupForm.value = true
}

const handleSaveGroup = async (data: { name: string; color: string }) => {
  if (editingGroup.value) {
    await window.api.groups.update(editingGroup.value.id, data.name, data.color)
  } else {
    await window.api.groups.create(data.name, data.color)
  }
  
  showGroupForm.value = false
  editingGroup.value = null
  await refreshData()
}

const handleDeleteGroup = async (id: string) => {
  if (confirm('确定要删除这个分组吗？分组内的待办事项不会被删除。')) {
    await window.api.groups.delete(id)
    if (selectedGroupId.value === id) {
      selectedGroupId.value = null
    }
    await refreshData()
  }
}

// Open new todo form
const openNewTodoForm = () => {
  editingTodo.value = null
  showTodoForm.value = true
}

// Initialize
onMounted(() => {
  refreshData()
  window.postMessage({ payload: 'removeLoading' }, '*')
  
  // Add platform class to body for platform-specific CSS
  if (navigator.userAgent.includes('Windows')) {
    document.body.classList.add('platform-windows')
  } else if (navigator.userAgent.includes('Mac')) {
    document.body.classList.add('platform-mac')
  }
})
</script>

<template>
  <div class="app-container">
    <Sidebar
      :groups="groups"
      :stats="stats"
      :active-tab="activeTab"
      :selected-group-id="selectedGroupId"
      @update:active-tab="activeTab = $event"
      @update:selected-group-id="selectedGroupId = $event"
      @add-group="handleAddGroup"
      @edit-group="handleEditGroup"
      @delete-group="handleDeleteGroup"
      @reorder-groups="handleReorderGroups"
    />
    
    <main class="main-content">
      <header class="content-header drag-region">
        <!-- Row 1: Title, Search, Actions -->
        <div class="header-top-row">
          <div class="header-title-section">
            <h1 class="page-title">{{ pageTitle }}</h1>
            <span class="count-badge">{{ totalCount }}</span>
          </div>

          <div class="header-main-actions no-drag">
            <div class="search-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input v-model="searchQuery" type="text" class="search-input" placeholder="搜索任务..." />
            </div>

            <button 
              v-if="activeTab === 'pending'"
              class="btn btn-primary add-btn"
              @click="openNewTodoForm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              新建待办
            </button>
          </div>
        </div>
        
        <!-- Row 2: Filters -->
        <div class="header-filters-row no-drag">
          <div class="filter-group">
            <!-- Group Selector -->
            <div class="filter-item">
              <label class="filter-label">分组:</label>
              <select v-model="selectedGroupId" class="select-filter">
                <option :value="null">全部分组</option>
                <option v-for="group in groups" :key="group.id" :value="group.id">
                  {{ group.name }}
                </option>
              </select>
            </div>

            <!-- Date Range (Only for completed) -->
            <div v-if="activeTab === 'completed'" class="filter-item date-range">
              <label class="filter-label">日期:</label>
              <div class="date-inputs">
                <input v-model="startDate" type="date" class="date-input" />
                <span class="date-sep">-</span>
                <input v-model="endDate" type="date" class="date-input" />
                <button v-if="startDate || endDate" class="clear-date" @click="startDate = ''; endDate = ''">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            </div>
          </div>

          <div class="view-controls">
            <button 
              class="control-btn" 
              :class="{ active: sortOrder === 'asc' }"
              @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
              :title="sortOrder === 'asc' ? '正序' : '倒序'"
            >
              <svg v-if="sortOrder === 'desc'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 12H3"></path><path d="M16 6H3"></path><path d="M16 18H3"></path><path d="M18 9l3 3-3 3"></path><path d="M21 12H11"></path>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 12H3"></path><path d="M16 6H3"></path><path d="M16 18H3"></path><path d="M21 9l-3 3 3 3"></path><path d="M18 12H11"></path>
              </svg>
            </button>
            
            <button 
              class="control-btn" 
              :class="{ active: isGrouped }"
              @click="isGrouped = !isGrouped"
              title="按分组展示"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      <!-- Todo List Area -->
      <div class="todos-container">
        <!-- Empty State -->
        <div v-if="processedTodos.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h3 class="empty-title">
            {{ activeTab === 'completed' ? '暂无符合条件的完成事项' : '太棒了！当前没有待办事项' }}
          </h3>
          <p class="empty-description">
            {{ activeTab === 'completed' 
              ? '尝试清除筛选条件或搜索关键词' 
              : '开启高效的一天，点击上方按钮创建新待办' 
            }}
          </p>
        </div>
        
        <!-- Grouped List View -->
        <div v-else-if="isGrouped && groupedTodos" class="grouped-todos-list">
          <div v-for="group in groupedTodos" :key="group.id || 'none'" class="todo-group-section">
            <div 
              class="group-section-header" 
              @click="toggleGroupCollapse(group.id)"
              :style="{ borderLeftColor: group.color }"
            >
              <span class="group-collapse-icon" :class="{ collapsed: collapsedGroups.has(group.id) }">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
              <span class="group-section-name">{{ group.name }}</span>
              <span class="group-section-count">{{ group.items.length }}</span>
            </div>
            
            <Transition name="group-collapse">
              <div v-if="!collapsedGroups.has(group.id)" class="group-section-items">
                <TodoItem
                  v-for="todo in group.items"
                  :key="todo.id"
                  :todo="todo"
                  :groups="groups"
                  @toggle="handleToggleTodo"
                  @edit="handleEditTodo"
                  @delete="handleDeleteTodo"
                />
              </div>
            </Transition>
          </div>
        </div>

        <!-- Flat List View -->
        <TransitionGroup v-else name="todo-list" tag="div" class="todos-list">
          <TodoItem
            v-for="todo in processedTodos"
            :key="todo.id"
            :todo="todo"
            :groups="groups"
            @toggle="handleToggleTodo"
            @edit="handleEditTodo"
            @delete="handleDeleteTodo"
          />
        </TransitionGroup>

        <!-- Load More Section -->
        <div v-if="hasMore" class="load-more-container">
          <button class="btn btn-secondary load-more-btn" @click="loadMore">
            加载更多 (剩余 {{ totalCount - todos.length }} 项)
          </button>
        </div>
      </div>
    </main>
    
    <!-- Modals -->
    <TodoForm
      v-if="showTodoForm"
      :todo="editingTodo"
      :groups="groups"
      @save="handleSaveTodo"
      @cancel="showTodoForm = false; editingTodo = null"
    />
    
    <GroupForm
      v-if="showGroupForm"
      :group="editingGroup"
      @save="handleSaveGroup"
      @cancel="showGroupForm = false; editingGroup = null"
    />
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg-primary);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Updated Header Styles */
.content-header {
  display: flex;
  flex-direction: column;
  padding: 12px 24px;
  padding-top: 16px;
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border);
}

/* Mac: extra top padding for traffic lights */
body.platform-mac .content-header {
  padding-top: 40px;
}

.header-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.header-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.count-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  background: var(--color-bg-tertiary);
  padding: 2px 8px;
  border-radius: 12px;
}

.header-main-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.search-box:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}

.search-input {
  background: transparent;
  border: none;
  outline: none;
  color: var(--color-text-primary);
  font-size: 0.875rem;
  width: 160px;
}

.add-btn {
  padding: 6px 16px;
  font-size: 0.875rem;
  height: 36px;
}

.header-filters-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.select-filter {
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-primary);
  font-size: 0.8125rem;
  padding: 4px 8px;
  outline: none;
  cursor: pointer;
}

.select-filter:hover {
  border-color: var(--color-border-hover);
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 2px 6px;
}

.date-input {
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  font-size: 0.75rem;
  outline: none;
  color-scheme: dark;
}

.date-sep {
  color: var(--color-text-muted);
}

.clear-date {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  padding: 2px;
}

.clear-date:hover {
  color: var(--color-error);
}

.view-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.control-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
}

.control-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.control-btn.active {
  color: var(--color-accent);
  background: rgba(99, 102, 241, 0.1);
}

.todos-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.todos-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Original logic for grouped list remains same */
.grouped-todos-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.todo-group-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group-section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  border-left: 4px solid;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
}

.group-section-header:hover {
  background: var(--color-bg-tertiary);
}

.group-collapse-icon {
  display: flex;
  align-items: center;
  transition: transform 0.2s ease;
}

.group-collapse-icon.collapsed {
  transform: rotate(-90deg);
}

.group-section-name {
  font-weight: 600;
  font-size: 0.8125rem;
  color: var(--color-text-primary);
}

.group-section-count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  background: rgba(255, 255, 255, 0.05);
  padding: 0 6px;
  border-radius: 10px;
}

.group-section-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 12px;
}

.load-more-container {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding-bottom: 32px;
}

/* Transitions */
.group-collapse-enter-active, .group-collapse-leave-active {
  transition: all 0.3s ease;
  max-height: 2000px;
  opacity: 1;
  overflow: hidden;
}

.group-collapse-enter-from, .group-collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.empty-icon {
  color: var(--color-text-muted);
  margin-bottom: 24px;
  opacity: 0.3;
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.empty-description {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}
</style>
