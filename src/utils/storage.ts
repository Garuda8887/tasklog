import type { AppData, Task } from '../types'

function migrateTask(task: Task): Task {
  return {
    ...task,
    subtasks: task.subtasks ?? [],
    timeLogs: task.timeLogs ?? [],
  }
}

const LEGACY_KEY = 'taskCalendar_v1'

const DEFAULT_DATA: AppData = {
  tasks: [],
  tags: [
    { id: 'tag-work', name: 'Work', color: '#3b82f6' },
    { id: 'tag-health', name: 'Health', color: '#10b981' },
    { id: 'tag-home', name: 'Home', color: '#f59e0b' },
    { id: 'tag-personal', name: 'Personal', color: '#8b5cf6' },
  ],
  completionLogs: [],
  journals: {},
}

function userKey(userId: string): string {
  return `taskCalendar_v1_${userId}`
}

export function loadData(userId: string): AppData {
  try {
    const key = userKey(userId)
    const raw = localStorage.getItem(key)
    // First-time user: migrate any legacy anonymous data
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_KEY)
      if (legacy) {
        const parsed: AppData = { ...DEFAULT_DATA, ...JSON.parse(legacy) }
        parsed.tasks = parsed.tasks.map(migrateTask)
        localStorage.setItem(key, JSON.stringify(parsed))
        return parsed
      }
      return { ...DEFAULT_DATA }
    }
    const parsed: AppData = { ...DEFAULT_DATA, ...JSON.parse(raw) }
    parsed.tasks = parsed.tasks.map(migrateTask)
    return parsed
  } catch {
    return { ...DEFAULT_DATA }
  }
}

export function saveData(userId: string, data: AppData): void {
  localStorage.setItem(userKey(userId), JSON.stringify(data))
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
