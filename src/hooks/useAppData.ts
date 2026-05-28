import { useState, useCallback, useMemo } from 'react'
import type { AppData, Task, Tag, CompletionLog, JournalEntry, TaskInstance, SubTask, TimeLog } from '../types'
import { loadData, saveData, generateId } from '../utils/storage'
import { today, isRecurringOnDate, computeStreak, toDateStr } from '../utils/dateUtils'
import { eachDayOfInterval, parseISO } from 'date-fns'

function useAppData(userId: string) {
  const [data, setData] = useState<AppData>(() => loadData(userId))

  const update = useCallback((updater: (d: AppData) => AppData) => {
    setData(prev => {
      const next = updater(prev)
      saveData(userId, next)
      return next
    })
  }, [])

  // Tasks
  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = { ...task, id: generateId(), createdAt: new Date().toISOString() }
    update(d => ({ ...d, tasks: [...d.tasks, newTask] }))
    return newTask
  }, [update])

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    update(d => ({
      ...d,
      tasks: d.tasks.map(t => t.id === id ? { ...t, ...patch } : t),
    }))
  }, [update])

  const deleteTask = useCallback((id: string) => {
    update(d => ({
      ...d,
      tasks: d.tasks.filter(t => t.id !== id),
      completionLogs: d.completionLogs.filter(l => l.taskId !== id),
    }))
  }, [update])

  const completeTask = useCallback((id: string) => {
    update(d => ({
      ...d,
      tasks: d.tasks.map(t =>
        t.id === id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
      ),
    }))
  }, [update])

  const uncompleteTask = useCallback((id: string) => {
    update(d => ({
      ...d,
      tasks: d.tasks.map(t =>
        t.id === id ? { ...t, completed: false, completedAt: undefined } : t
      ),
    }))
  }, [update])

  // Recurring completions
  const completeRecurringInstance = useCallback((taskId: string, instanceDate: string) => {
    const existing = data.completionLogs.find(
      l => l.taskId === taskId && l.date === instanceDate
    )
    if (existing) {
      // Uncomplete
      update(d => ({
        ...d,
        completionLogs: d.completionLogs.filter(l => l.id !== existing.id),
      }))
    } else {
      const log: CompletionLog = {
        id: generateId(),
        taskId,
        date: instanceDate,
        completedAt: new Date().toISOString(),
      }
      update(d => ({ ...d, completionLogs: [...d.completionLogs, log] }))
    }
  }, [data.completionLogs, update])

  const isRecurringCompleted = useCallback((taskId: string, date: string): boolean => {
    return data.completionLogs.some(l => l.taskId === taskId && l.date === date)
  }, [data.completionLogs])

  // Get all task instances for a date range
  const getInstancesForDate = useCallback((dateStr: string): TaskInstance[] => {
    const instances: TaskInstance[] = []
    const todayStr = today()

    for (const task of data.tasks) {
      if (task.isRecurring) {
        if (isRecurringOnDate(task, dateStr)) {
          const logEntry = data.completionLogs.find(
            l => l.taskId === task.id && l.date === dateStr
          )
          instances.push({
            task,
            instanceDate: dateStr,
            isCompleted: !!logEntry,
            logId: logEntry?.id,
          })
        }
      } else {
        // Regular tasks: show on due date, plus show overdue on today
        if (task.dueDate === dateStr) {
          instances.push({ task, instanceDate: dateStr, isCompleted: task.completed })
        } else if (dateStr === todayStr && task.dueDate < todayStr && !task.completed) {
          // Overdue rollover
          instances.push({ task, instanceDate: dateStr, isCompleted: false })
        }
      }
    }
    return instances.sort((a, b) => {
      const pOrder = { urgent: 0, high: 1, normal: 2, low: 3 }
      return pOrder[a.task.priority] - pOrder[b.task.priority]
    })
  }, [data.tasks, data.completionLogs])

  // Tags
  const addTag = useCallback((tag: Omit<Tag, 'id'>) => {
    const newTag: Tag = { ...tag, id: generateId() }
    update(d => ({ ...d, tags: [...d.tags, newTag] }))
  }, [update])

  const deleteTag = useCallback((id: string) => {
    update(d => ({
      ...d,
      tags: d.tags.filter(t => t.id !== id),
      tasks: d.tasks.map(t => ({ ...t, tagIds: t.tagIds.filter(tid => tid !== id) })),
    }))
  }, [update])

  // Journal
  const saveJournal = useCallback((date: string, content: string) => {
    update(d => ({
      ...d,
      journals: {
        ...d.journals,
        [date]: { date, content, updatedAt: new Date().toISOString() },
      },
    }))
  }, [update])

  const getJournal = useCallback((date: string): JournalEntry | undefined => {
    return data.journals[date]
  }, [data.journals])

  // Reschedule
  const rescheduleTask = useCallback((taskId: string, newDate: string) => {
    update(d => ({
      ...d,
      tasks: d.tasks.map(t => t.id === taskId ? { ...t, dueDate: newDate } : t),
    }))
  }, [update])

  // Streak
  const getStreak = useCallback((taskId: string): number => {
    const task = data.tasks.find(t => t.id === taskId)
    if (!task) return 0
    return computeStreak(task, data.completionLogs)
  }, [data.tasks, data.completionLogs])

  // Weekly summary
  const getWeeklySummary = useCallback((weekStart: Date) => {
    const days = eachDayOfInterval({ start: weekStart, end: new Date(weekStart.getTime() + 6 * 86400000) })
    let completed = 0
    let missed = 0
    let total = 0

    for (const day of days) {
      const dateStr = toDateStr(day)
      const instances = getInstancesForDate(dateStr)
      for (const inst of instances) {
        total++
        if (inst.isCompleted) completed++
        else if (dateStr < today()) missed++
      }
    }
    return { completed, missed, total, pending: total - completed - missed }
  }, [getInstancesForDate])

  // Subtasks
  const updateSubtasks = useCallback((taskId: string, subtasks: SubTask[]) => {
    update(d => ({
      ...d,
      tasks: d.tasks.map(t => t.id === taskId ? { ...t, subtasks } : t),
    }))
  }, [update])

  // Time logs
  const updateTimeLogs = useCallback((taskId: string, timeLogs: TimeLog[]) => {
    update(d => ({
      ...d,
      tasks: d.tasks.map(t => t.id === taskId ? { ...t, timeLogs } : t),
    }))
  }, [update])

  const getTotalTimeLogged = useCallback((taskId: string): number => {
    const task = data.tasks.find(t => t.id === taskId)
    return task?.timeLogs.reduce((sum, l) => sum + l.seconds, 0) ?? 0
  }, [data.tasks])

  const getWeeklyTimeLogged = useCallback((weekStart: Date): number => {
    const weekStartTs = weekStart.getTime()
    const weekEndTs = weekStartTs + 7 * 86400000
    return data.tasks.reduce((total, task) => {
      return total + task.timeLogs
        .filter(l => {
          const ts = new Date(l.startedAt).getTime()
          return ts >= weekStartTs && ts < weekEndTs
        })
        .reduce((s, l) => s + l.seconds, 0)
    }, 0)
  }, [data.tasks])

  return {
    data,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    uncompleteTask,
    completeRecurringInstance,
    isRecurringCompleted,
    getInstancesForDate,
    addTag,
    deleteTag,
    saveJournal,
    getJournal,
    rescheduleTask,
    getStreak,
    getWeeklySummary,
    updateSubtasks,
    updateTimeLogs,
    getTotalTimeLogged,
    getWeeklyTimeLogged,
  }
}

export default useAppData
