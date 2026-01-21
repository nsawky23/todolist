import { ipcMain } from 'electron'
import * as db from './database'

export function setupIpcHandlers(): void {
    // Group handlers
    ipcMain.handle('groups:getAll', () => {
        return db.getAllGroups()
    })

    ipcMain.handle('groups:create', (_, name: string, color: string) => {
        return db.createGroup(name, color)
    })

    ipcMain.handle('groups:update', (_, id: string, name: string, color: string) => {
        return db.updateGroup(id, name, color)
    })

    ipcMain.handle('groups:delete', (_, id: string) => {
        db.deleteGroup(id)
        return { success: true }
    })

    ipcMain.handle('groups:reorder', (_, orderedIds: string[]) => {
        db.updateGroupsOrder(orderedIds)
        return { success: true }
    })

    // Todo handlers
    ipcMain.handle('todos:getAll', (_, completed: boolean = false) => {
        return db.getAllTodos(completed)
    })

    ipcMain.handle('todos:query', (_, options: db.TodoQueryOptions) => {
        return db.queryTodos(options)
    })

    ipcMain.handle('todos:getById', (_, id: string) => {
        return db.getTodoById(id)
    })

    ipcMain.handle('todos:create', (_, title: string, description: string = '', groupId: string | null = null, dueDate: string | null = null) => {
        return db.createTodo(title, description, groupId, dueDate)
    })

    ipcMain.handle('todos:update', (_, id: string, title: string, description: string, groupId: string | null, dueDate: string | null) => {
        return db.updateTodo(id, title, description, groupId, dueDate)
    })

    ipcMain.handle('todos:toggleComplete', (_, id: string) => {
        return db.toggleTodoComplete(id)
    })

    ipcMain.handle('todos:delete', (_, id: string) => {
        db.deleteTodo(id)
        return { success: true }
    })

    // Stats handler
    ipcMain.handle('stats:get', () => {
        return db.getStats()
    })

    // System info handler
    ipcMain.handle('system:getDatabasePath', () => {
        return db.getDatabasePath()
    })
}
