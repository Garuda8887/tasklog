import type { Task, CompletionLog } from '../types'
import { isRecurringOnDate } from './dateUtils'
import { addDays, format, parseISO } from 'date-fns'

function icalDate(dateStr: string): string {
  return dateStr.replace(/-/g, '')
}

function icalDateTime(iso: string): string {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '').replace('Z', 'Z')
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

const PRIORITY_MAP = { urgent: 1, high: 3, normal: 5, low: 9 }

function makeEvent(task: Task, dateStr: string): string {
  const uid = `${task.id}-${dateStr}@tasklog`
  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${icalDateTime(new Date().toISOString())}`,
    `DTSTART;VALUE=DATE:${icalDate(dateStr)}`,
    `DTEND;VALUE=DATE:${icalDate(format(addDays(parseISO(dateStr), 1), 'yyyy-MM-dd'))}`,
    `SUMMARY:${escapeText(task.title)}`,
    task.description ? `DESCRIPTION:${escapeText(task.description)}` : '',
    `PRIORITY:${PRIORITY_MAP[task.priority]}`,
    task.completed ? 'STATUS:COMPLETED' : 'STATUS:NEEDS-ACTION',
    'END:VEVENT',
  ].filter(Boolean)
  return lines.join('\r\n')
}

export function exportToICal(tasks: Task[], logs: CompletionLog[]): void {
  const events: string[] = []

  // Look 90 days back and 180 days forward
  const start = new Date()
  start.setDate(start.getDate() - 90)

  for (const task of tasks) {
    if (task.isRecurring) {
      // Generate instances over 180 days ahead
      for (let i = -90; i <= 180; i++) {
        const d = addDays(new Date(), i)
        const ds = format(d, 'yyyy-MM-dd')
        if (isRecurringOnDate(task, ds)) events.push(makeEvent(task, ds))
      }
    } else {
      events.push(makeEvent(task, task.dueDate))
    }
  }

  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TaskLog//TaskLog Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:TaskLog',
    'X-WR-TIMEZONE:UTC',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([ical], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'tasklog.ics'
  a.click()
  URL.revokeObjectURL(url)
}
