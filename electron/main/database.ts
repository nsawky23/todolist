import Database from 'better-sqlite3'
import path from 'node:path'
import { app } from 'electron'
import { v4 as uuidv4 } from 'uuid'

// Database file path in user data directory
// macOS: ~/Library/Application Support/待办清单/todolist.db
// Windows: %APPDATA%/待办清单/todolist.db
// Linux: ~/.config/待办清单/todolist.db
const dbPath = path.join(app.getPath('userData'), 'todolist.db')

console.log('[Database] Data file location:', dbPath)

// Create database connection
const db = new Database(dbPath)

// Database version - increment this when schema changes
const DB_VERSION = 2

// Initialize database with version control
function initializeDatabase() {
  // Create version table if not exists (this is the only check that runs every time)
  db.exec(`
    CREATE TABLE IF NOT EXISTS db_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  // Get current database version
  const versionRow = db.prepare('SELECT value FROM db_meta WHERE key = ?').get('version') as { value: string } | undefined
  const currentVersion = versionRow ? parseInt(versionRow.value, 10) : 0

  if (currentVersion < DB_VERSION) {
    console.log(`[Database] Upgrading from version ${currentVersion} to ${DB_VERSION}`)
    runMigrations(currentVersion)

    // Update version
    db.prepare('INSERT OR REPLACE INTO db_meta (key, value) VALUES (?, ?)').run('version', DB_VERSION.toString())
    console.log('[Database] Migration complete')
  } else {
    console.log('[Database] Schema is up to date (version', currentVersion, ')')
  }
}

// Run migrations based on current version
function runMigrations(fromVersion: number) {
  // Version 0 -> 1: Initial schema
  if (fromVersion < 1) {
    console.log('[Database] Running migration: v0 -> v1 (Initial schema)')

    db.exec(`
      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#6366f1',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );

      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        group_id TEXT,
        due_date TEXT,
        completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        completed_at TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
      CREATE INDEX IF NOT EXISTS idx_todos_group_id ON todos(group_id);
    `)

    // Insert default groups for new installations
    const groupCount = db.prepare('SELECT COUNT(*) as count FROM groups').get() as { count: number }
    if (groupCount.count === 0) {
      const defaultGroups = [
        { id: uuidv4(), name: '工作', color: '#6366f1', sort_order: 0 },
        { id: uuidv4(), name: '个人', color: '#10b981', sort_order: 1 },
        { id: uuidv4(), name: '学习', color: '#f59e0b', sort_order: 2 },
      ]
      const insertGroup = db.prepare('INSERT INTO groups (id, name, color, sort_order) VALUES (?, ?, ?, ?)')
      for (const group of defaultGroups) {
        insertGroup.run(group.id, group.name, group.color, group.sort_order)
      }
      console.log('[Database] Created default groups')
    }
  }

  // Version 1 -> 2: Add soft delete support
  if (fromVersion < 2) {
    console.log('[Database] Running migration: v1 -> v2 (Soft delete support)')

    // Add deleted_at column to todos table
    try {
      db.exec(`ALTER TABLE todos ADD COLUMN deleted_at TEXT`)
      console.log('[Database] Added deleted_at column to todos table')
    } catch (e) {
      // Column might already exist
    }

    // Add deleted_at column to groups table
    try {
      db.exec(`ALTER TABLE groups ADD COLUMN deleted_at TEXT`)
      console.log('[Database] Added deleted_at column to groups table')
    } catch (e) {
      // Column might already exist
    }
  }

  // Future migrations would go here:
  // if (fromVersion < 3) { ... }
}

// Run initialization
initializeDatabase()

// Handle legacy databases without due_date column
try {
  db.exec(`ALTER TABLE todos ADD COLUMN due_date TEXT`)
  console.log('[Database] Added due_date column (legacy migration)')
} catch (e) {
  // Column already exists, ignore
}

// Types
export interface Group {
  id: string
  name: string
  color: string
  sort_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
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
  deleted_at: string | null
}

export interface TodoWithGroup extends Todo {
  group_name: string | null
  group_color: string | null
}

// Group operations
export function getAllGroups(): Group[] {
  return db.prepare('SELECT * FROM groups WHERE deleted_at IS NULL ORDER BY sort_order ASC').all() as Group[]
}

export function createGroup(name: string, color: string): Group {
  const id = uuidv4()
  const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM groups WHERE deleted_at IS NULL').get() as { max: number | null }
  const sortOrder = (maxOrder.max ?? -1) + 1

  db.prepare('INSERT INTO groups (id, name, color, sort_order) VALUES (?, ?, ?, ?)').run(id, name, color, sortOrder)
  return db.prepare('SELECT * FROM groups WHERE id = ?').get(id) as Group
}

export function updateGroup(id: string, name: string, color: string): Group {
  db.prepare("UPDATE groups SET name = ?, color = ?, updated_at = datetime('now', 'localtime') WHERE id = ?").run(name, color, id)
  return db.prepare('SELECT * FROM groups WHERE id = ?').get(id) as Group
}

// Update group sort order (for drag & drop reordering)
export function updateGroupsOrder(orderedIds: string[]): void {
  const stmt = db.prepare('UPDATE groups SET sort_order = ? WHERE id = ?')
  const updateMany = db.transaction((ids: string[]) => {
    ids.forEach((id, index) => {
      stmt.run(index, id)
    })
  })
  updateMany(orderedIds)
}

export function deleteGroup(id: string): void {
  // Set todos in this group to have no group
  db.prepare('UPDATE todos SET group_id = NULL, updated_at = datetime(\'now\', \'localtime\') WHERE group_id = ? AND deleted_at IS NULL').run(id)
  // Soft delete the group
  db.prepare("UPDATE groups SET deleted_at = datetime('now', 'localtime'), updated_at = datetime('now', 'localtime') WHERE id = ?").run(id)
}

// Query options interface
export type SortByField = 'created_at' | 'due_date'

export interface TodoQueryOptions {
  completed?: boolean
  groupIds?: string[]  // empty array = all groups, ['none'] = no group only
  sortBy?: SortByField  // which field to sort by
  sortOrder?: 'asc' | 'desc'  // sort direction
  startDate?: string  // YYYY-MM-DD format
  endDate?: string    // YYYY-MM-DD format
  limit?: number
  offset?: number
}

export interface TodoQueryResult {
  items: TodoWithGroup[]
  total: number
  hasMore: boolean
}

// Advanced todo query with filtering, sorting and pagination
export function queryTodos(options: TodoQueryOptions): TodoQueryResult {
  const {
    completed = false,
    groupIds,
    sortBy = 'created_at',
    sortOrder = 'desc',
    startDate,
    endDate,
    limit = 200,
    offset = 0
  } = options

  const conditions: string[] = ['t.completed = ?', 't.deleted_at IS NULL']
  const params: any[] = [completed ? 1 : 0]

  // Group filter - support multiple groups
  if (groupIds && groupIds.length > 0) {
    const hasNone = groupIds.includes('none')
    const actualGroupIds = groupIds.filter(id => id !== 'none')

    if (hasNone && actualGroupIds.length > 0) {
      // Include both null group and specific groups
      const placeholders = actualGroupIds.map(() => '?').join(', ')
      conditions.push(`(t.group_id IS NULL OR t.group_id IN (${placeholders}))`)
      params.push(...actualGroupIds)
    } else if (hasNone) {
      // Only null group
      conditions.push('t.group_id IS NULL')
    } else {
      // Only specific groups
      const placeholders = actualGroupIds.map(() => '?').join(', ')
      conditions.push(`t.group_id IN (${placeholders})`)
      params.push(...actualGroupIds)
    }
  }

  // Date range filter (for completed items)
  if (startDate) {
    conditions.push('date(t.created_at) >= ?')
    params.push(startDate)
  }
  if (endDate) {
    conditions.push('date(t.created_at) <= ?')
    params.push(endDate)
  }

  const whereClause = conditions.join(' AND ')
  const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC'

  // Build ORDER BY clause based on sortBy field
  let orderByClause: string
  if (sortBy === 'due_date') {
    // For due_date sorting:
    // - Items with due_date come first, sorted by due_date
    // - Items without due_date come after, sorted by created_at
    if (sortOrder === 'asc') {
      // Ascending: earliest due date first, then no due date items by created_at desc (newest first)
      orderByClause = `CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END ASC, t.due_date ASC, t.created_at DESC`
    } else {
      // Descending: latest due date first, then no due date items by created_at desc
      orderByClause = `CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END ASC, t.due_date DESC, t.created_at DESC`
    }
  } else {
    // Default: sort by created_at
    orderByClause = `t.created_at ${orderDirection}`
  }

  // Get total count
  const countSql = `SELECT COUNT(*) as count FROM todos t WHERE ${whereClause}`
  const total = (db.prepare(countSql).get(...params) as { count: number }).count

  // Get items with pagination
  const sql = `
    SELECT 
      t.*,
      g.name as group_name,
      g.color as group_color,
      g.sort_order as group_sort_order
    FROM todos t
    LEFT JOIN groups g ON t.group_id = g.id
    WHERE ${whereClause}
    ORDER BY ${orderByClause}
    LIMIT ? OFFSET ?
  `
  const items = db.prepare(sql).all(...params, limit, offset) as TodoWithGroup[]

  return {
    items,
    total,
    hasMore: offset + items.length < total
  }
}

// Legacy function for backward compatibility
export function getAllTodos(completed: boolean = false): TodoWithGroup[] {
  return queryTodos({ completed }).items
}

export function getTodoById(id: string): TodoWithGroup | null {
  const sql = `
    SELECT 
      t.*,
      g.name as group_name,
      g.color as group_color
    FROM todos t
    LEFT JOIN groups g ON t.group_id = g.id
    WHERE t.id = ? AND t.deleted_at IS NULL
  `
  return (db.prepare(sql).get(id) as TodoWithGroup) || null
}

export function createTodo(title: string, description: string = '', groupId: string | null = null, dueDate: string | null = null): TodoWithGroup {
  const id = uuidv4()
  db.prepare('INSERT INTO todos (id, title, description, group_id, due_date) VALUES (?, ?, ?, ?, ?)').run(id, title, description, groupId, dueDate)
  return getTodoById(id)!
}

export function updateTodo(id: string, title: string, description: string, groupId: string | null, dueDate: string | null): TodoWithGroup {
  db.prepare(`
    UPDATE todos 
    SET title = ?, description = ?, group_id = ?, due_date = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(title, description, groupId, dueDate, id)
  return getTodoById(id)!
}

export function toggleTodoComplete(id: string): TodoWithGroup {
  const todo = getTodoById(id)
  if (!todo) throw new Error('Todo not found')

  const newCompleted = todo.completed ? 0 : 1

  db.prepare(`
    UPDATE todos 
    SET completed = ?, completed_at = ${newCompleted ? "datetime('now', 'localtime')" : 'NULL'}, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(newCompleted, id)

  return getTodoById(id)!
}

export function deleteTodo(id: string): void {
  // Soft delete - set deleted_at timestamp
  db.prepare("UPDATE todos SET deleted_at = datetime('now', 'localtime'), updated_at = datetime('now', 'localtime') WHERE id = ?").run(id)
}

// Statistics
export function getStats(): { total: number; completed: number; pending: number } {
  const total = (db.prepare('SELECT COUNT(*) as count FROM todos WHERE deleted_at IS NULL').get() as { count: number }).count
  const completed = (db.prepare('SELECT COUNT(*) as count FROM todos WHERE completed = 1 AND deleted_at IS NULL').get() as { count: number }).count
  return {
    total,
    completed,
    pending: total - completed,
  }
}

// Get database path (for debugging)
export function getDatabasePath(): string {
  return dbPath
}

export function closeDatabase(): void {
  db.close()
}
