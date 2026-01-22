// Types for the Todo application

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

export type SortByField = 'created_at' | 'due_date'

export interface TodoQueryOptions {
    completed?: boolean
    groupId?: string | null
    sortBy?: SortByField
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

// API interface exposed by preload
export interface Api {
    groups: {
        getAll: () => Promise<Group[]>
        create: (name: string, color: string) => Promise<Group>
        update: (id: string, name: string, color: string) => Promise<Group>
        delete: (id: string) => Promise<{ success: boolean }>
        reorder: (orderedIds: string[]) => Promise<{ success: boolean }>
    }
    todos: {
        getAll: (completed?: boolean) => Promise<Todo[]>
        query: (options: TodoQueryOptions) => Promise<TodoQueryResult>
        getById: (id: string) => Promise<Todo | null>
        create: (title: string, description?: string, groupId?: string | null, dueDate?: string | null) => Promise<Todo>
        update: (id: string, title: string, description: string, groupId: string | null, dueDate: string | null) => Promise<Todo>
        toggleComplete: (id: string) => Promise<Todo>
        delete: (id: string) => Promise<{ success: boolean }>
    }
    stats: {
        get: () => Promise<Stats>
    }
    system: {
        getDatabasePath: () => Promise<string>
    }
}

declare global {
    interface Window {
        api: Api
    }
}

export { }
