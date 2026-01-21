import { ipcRenderer, contextBridge } from 'electron'

// Types
export interface Group {
  id: string
  name: string
  color: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Todo {
  id: string
  title: string
  description: string
  group_id: string | null
  due_date: string | null
  completed: number
  created_at: string
  completed_at: string | null
  updated_at: string
  group_name: string | null
  group_color: string | null
}

export interface Stats {
  total: number
  completed: number
  pending: number
}

export interface TodoQueryOptions {
  completed?: boolean
  groupId?: string | null
  sortOrder?: 'asc' | 'desc'
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

export interface TodoQueryResult {
  items: Todo[]
  total: number
  hasMore: boolean
}

// API exposed to renderer
const api = {
  // Group operations
  groups: {
    getAll: (): Promise<Group[]> => ipcRenderer.invoke('groups:getAll'),
    create: (name: string, color: string): Promise<Group> =>
      ipcRenderer.invoke('groups:create', name, color),
    update: (id: string, name: string, color: string): Promise<Group> =>
      ipcRenderer.invoke('groups:update', id, name, color),
    delete: (id: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('groups:delete', id),
    reorder: (orderedIds: string[]): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('groups:reorder', orderedIds),
  },

  // Todo operations
  todos: {
    getAll: (completed: boolean = false): Promise<Todo[]> =>
      ipcRenderer.invoke('todos:getAll', completed),
    query: (options: TodoQueryOptions): Promise<TodoQueryResult> =>
      ipcRenderer.invoke('todos:query', options),
    getById: (id: string): Promise<Todo | null> =>
      ipcRenderer.invoke('todos:getById', id),
    create: (title: string, description?: string, groupId?: string | null, dueDate?: string | null): Promise<Todo> =>
      ipcRenderer.invoke('todos:create', title, description || '', groupId || null, dueDate || null),
    update: (id: string, title: string, description: string, groupId: string | null, dueDate: string | null): Promise<Todo> =>
      ipcRenderer.invoke('todos:update', id, title, description, groupId, dueDate),
    toggleComplete: (id: string): Promise<Todo> =>
      ipcRenderer.invoke('todos:toggleComplete', id),
    delete: (id: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('todos:delete', id),
  },

  // Stats
  stats: {
    get: (): Promise<Stats> => ipcRenderer.invoke('stats:get'),
  },

  // System
  system: {
    getDatabasePath: (): Promise<string> => ipcRenderer.invoke('system:getDatabasePath'),
  }
}

// Expose API to renderer
contextBridge.exposeInMainWorld('api', api)

// Also expose ipcRenderer for backward compatibility
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

// --------- Preload scripts loading ---------
function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find(e => e === child)) {
      return parent.appendChild(child)
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find(e => e === child)) {
      return parent.removeChild(child)
    }
  },
}

function useLoading() {
  const styleContent = `
    .app-loading-wrap {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%);
      z-index: 9;
    }
    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 3px solid rgba(99, 102, 241, 0.2);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `
  const oStyle = document.createElement('style')
  const oDiv = document.createElement('div')

  oStyle.id = 'app-loading-style'
  oStyle.innerHTML = styleContent
  oDiv.className = 'app-loading-wrap'
  oDiv.innerHTML = '<div class="loading-spinner"></div>'

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    },
  }
}

const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.onmessage = (ev) => {
  ev.data.payload === 'removeLoading' && removeLoading()
}

setTimeout(removeLoading, 4999)
