import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
  addWeeks,
  addMonths,
  isSameDay,
  isBefore,
  isAfter,
  parseISO,
  differenceInDays,
  differenceInWeeks,
  differenceInCalendarMonths,
} from 'date-fns'
import type { Task, CompletionLog } from '../types'

export const toDateStr = (d: Date): string => format(d, 'yyyy-MM-dd')
export const today = (): string => toDateStr(new Date())

export function getMonthGrid(year: number, month: number): Date[] {
  const start = startOfWeek(startOfMonth(new Date(year, month)), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(new Date(year, month)), { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
}

export function getWeekDays(anchorDate: Date): Date[] {
  const start = startOfWeek(anchorDate, { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end: addDays(start, 6) })
}

export function isRecurringOnDate(task: Task, dateStr: string): boolean {
  if (!task.isRecurring) return false
  const date = parseISO(dateStr)
  const start = parseISO(task.dueDate)
  if (isBefore(date, start)) return false
  if (task.recurEndDate && isAfter(date, parseISO(task.recurEndDate))) return false

  const freq = task.recurFrequency
  const interval = task.recurInterval ?? 1

  if (freq === 'daily') {
    const diff = differenceInDays(date, start)
    return diff % interval === 0
  }
  if (freq === 'weekly') {
    const diff = differenceInWeeks(date, start)
    if (diff % interval !== 0) return false
    if (task.recurDaysOfWeek && task.recurDaysOfWeek.length > 0) {
      return task.recurDaysOfWeek.includes(date.getDay())
    }
    return isSameDay(date, addWeeks(start, diff))
  }
  if (freq === 'monthly') {
    const diff = differenceInCalendarMonths(date, start)
    if (diff % interval !== 0) return false
    return date.getDate() === start.getDate()
  }
  return false
}

export function computeStreak(task: Task, logs: CompletionLog[]): number {
  if (!task.isRecurring) return 0
  const taskLogs = logs
    .filter(l => l.taskId === task.id)
    .map(l => l.date)
    .sort()
    .reverse()

  if (taskLogs.length === 0) return 0

  let streak = 0
  let checkDate = new Date()

  const freq = task.recurFrequency ?? 'daily'
  const interval = task.recurInterval ?? 1

  for (let i = 0; i < 365; i++) {
    const dateStr = toDateStr(checkDate)
    if (!isRecurringOnDate(task, dateStr)) {
      checkDate = stepBack(checkDate, freq, interval)
      continue
    }
    if (taskLogs.includes(dateStr)) {
      streak++
      checkDate = stepBack(checkDate, freq, interval)
    } else {
      break
    }
  }
  return streak
}

function stepBack(d: Date, freq: string, interval: number): Date {
  if (freq === 'daily') return addDays(d, -interval)
  if (freq === 'weekly') return addWeeks(d, -interval)
  if (freq === 'monthly') return addMonths(d, -interval)
  return addDays(d, -1)
}

export function getOverdueDates(task: Task, logs: CompletionLog[]): string[] {
  if (task.completed || task.isRecurring) return []
  const due = task.dueDate
  if (due < today()) return [due]
  return []
}

export { format, isSameDay, isBefore, isAfter, parseISO, addDays, addWeeks, addMonths }
