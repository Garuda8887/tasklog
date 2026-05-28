import type { Priority, RecurFrequency } from '../types'
import { addDays, addWeeks, nextDay, startOfWeek, format } from 'date-fns'

export interface ParsedTask {
  title: string
  dueDate?: string
  priority?: Priority
  isRecurring?: boolean
  recurFrequency?: RecurFrequency
  recurInterval?: number
  recurDaysOfWeek?: number[]
}

const DAYS: Record<string, number> = {
  sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tuesday: 2,
  wed: 3, wednesday: 3, thu: 4, thursday: 4, fri: 5, friday: 5,
  sat: 6, saturday: 6,
}

const PRIORITY_WORDS: Record<string, Priority> = {
  urgent: 'urgent', asap: 'urgent', critical: 'urgent',
  high: 'high', important: 'high',
  low: 'low', someday: 'low', eventually: 'low',
}

function fmt(d: Date) { return format(d, 'yyyy-MM-dd') }

export function parseNaturalTask(input: string): ParsedTask {
  let text = input.trim()
  const today = new Date()
  let dueDate: string | undefined
  let priority: Priority | undefined
  let isRecurring: boolean | undefined
  let recurFrequency: RecurFrequency | undefined
  let recurInterval: number | undefined
  let recurDaysOfWeek: number[] | undefined

  // Strip and detect priority keywords
  for (const [word, p] of Object.entries(PRIORITY_WORDS)) {
    const re = new RegExp(`\\b${word}\\b`, 'i')
    if (re.test(text)) {
      priority = p
      text = text.replace(re, '').trim()
      break
    }
  }

  // Recurring patterns
  if (/\bevery\s+day\b|\bdaily\b/i.test(text)) {
    isRecurring = true; recurFrequency = 'daily'; recurInterval = 1
    text = text.replace(/\bevery\s+day\b|\bdaily\b/i, '').trim()
  } else if (/\bevery\s+weekday\b/i.test(text)) {
    isRecurring = true; recurFrequency = 'weekly'; recurDaysOfWeek = [1,2,3,4,5]
    text = text.replace(/\bevery\s+weekday\b/i, '').trim()
  } else if (/\bevery\s+weekend\b/i.test(text)) {
    isRecurring = true; recurFrequency = 'weekly'; recurDaysOfWeek = [0,6]
    text = text.replace(/\bevery\s+weekend\b/i, '').trim()
  } else if (/\bevery\s+(\d+)\s+(day|week|month)s?\b/i.test(text)) {
    const m = text.match(/\bevery\s+(\d+)\s+(day|week|month)s?\b/i)!
    isRecurring = true
    recurInterval = parseInt(m[1])
    recurFrequency = (m[2].toLowerCase() + (m[2].endsWith('y') ? '' : 'ly')) as RecurFrequency
    if (m[2] === 'day') recurFrequency = 'daily'
    if (m[2] === 'week') recurFrequency = 'weekly'
    if (m[2] === 'month') recurFrequency = 'monthly'
    text = text.replace(m[0], '').trim()
  } else {
    // "every monday", "every tuesday and thursday"
    const everyDayMatch = text.match(/\bevery\s+((?:(?:mon|tue|wed|thu|fri|sat|sun)\w*(?:\s+and\s+)?)+)\b/i)
    if (everyDayMatch) {
      const dayStr = everyDayMatch[1].toLowerCase()
      const dayNums: number[] = []
      for (const [d, n] of Object.entries(DAYS)) {
        if (dayStr.includes(d)) dayNums.push(n)
      }
      if (dayNums.length) {
        isRecurring = true; recurFrequency = 'weekly'; recurDaysOfWeek = [...new Set(dayNums)]
      }
      text = text.replace(everyDayMatch[0], '').trim()
    } else if (/\bweekly\b/i.test(text)) {
      isRecurring = true; recurFrequency = 'weekly'; recurInterval = 1
      text = text.replace(/\bweekly\b/i, '').trim()
    } else if (/\bmonthly\b/i.test(text)) {
      isRecurring = true; recurFrequency = 'monthly'; recurInterval = 1
      text = text.replace(/\bmonthly\b/i, '').trim()
    }
  }

  // Date phrases — only if not recurring (or use as start date)
  const todayFmt = fmt(today)
  if (/\btoday\b/i.test(text)) {
    dueDate = todayFmt
    text = text.replace(/\btoday\b/i, '').trim()
  } else if (/\btomorrow\b/i.test(text)) {
    dueDate = fmt(addDays(today, 1))
    text = text.replace(/\btomorrow\b/i, '').trim()
  } else if (/\bnext\s+week\b/i.test(text)) {
    dueDate = fmt(addWeeks(today, 1))
    text = text.replace(/\bnext\s+week\b/i, '').trim()
  } else if (/\bin\s+(\d+)\s+days?\b/i.test(text)) {
    const m = text.match(/\bin\s+(\d+)\s+days?\b/i)!
    dueDate = fmt(addDays(today, parseInt(m[1])))
    text = text.replace(m[0], '').trim()
  } else if (/\bnext\s+(mon|tue|wed|thu|fri|sat|sun)\w*\b/i.test(text)) {
    const m = text.match(/\bnext\s+(mon|tue|wed|thu|fri|sat|sun)\w*\b/i)!
    const dayNum = DAYS[m[1].toLowerCase()]
    if (dayNum !== undefined) {
      dueDate = fmt(nextDay(today, dayNum as 0|1|2|3|4|5|6))
    }
    text = text.replace(m[0], '').trim()
  } else {
    // bare day name: "monday", "friday"
    const bareDay = text.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i)
    if (bareDay) {
      const dayNum = DAYS[bareDay[1].toLowerCase()]
      if (dayNum !== undefined) {
        dueDate = fmt(nextDay(today, dayNum as 0|1|2|3|4|5|6))
        text = text.replace(bareDay[0], '').trim()
      }
    }
  }

  // Clean up leftover punctuation / extra spaces
  const title = text.replace(/\s{2,}/g, ' ').replace(/^[,\s]+|[,\s]+$/g, '').trim()

  return { title: title || input.trim(), dueDate, priority, isRecurring, recurFrequency, recurInterval, recurDaysOfWeek }
}
