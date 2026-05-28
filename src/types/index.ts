export type Priority = 'urgent' | 'high' | 'normal' | 'low'
export type ViewMode = 'month' | 'week' | 'agenda'
export type RecurFrequency = 'daily' | 'weekly' | 'monthly'

export interface Tag {
  id: string
  name: string
  color: string
}

export interface SubTask {
  id: string
  title: string
  completed: boolean
}

export interface TimeLog {
  id: string
  startedAt: string  // ISO timestamp
  endedAt: string    // ISO timestamp
  seconds: number
}

export interface Task {
  id: string
  title: string
  description: string
  dueDate: string // YYYY-MM-DD
  completed: boolean
  completedAt?: string
  priority: Priority
  tagIds: string[]
  isRecurring: boolean
  recurFrequency?: RecurFrequency
  recurInterval?: number
  recurDaysOfWeek?: number[] // 0=Sun..6=Sat
  recurEndDate?: string
  subtasks: SubTask[]
  timeLogs: TimeLog[]
  createdAt: string
}

export interface CompletionLog {
  id: string
  taskId: string
  date: string // YYYY-MM-DD
  completedAt: string
}

export interface JournalEntry {
  date: string // YYYY-MM-DD
  content: string
  updatedAt: string
}

export interface AppData {
  tasks: Task[]
  tags: Tag[]
  completionLogs: CompletionLog[]
  journals: Record<string, JournalEntry>
}

export interface TaskInstance {
  task: Task
  instanceDate: string // YYYY-MM-DD
  isCompleted: boolean
  logId?: string
}
