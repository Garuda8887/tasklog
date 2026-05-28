import type { Task } from '../types'
import { today, isRecurringOnDate } from './dateUtils'

const NOTIF_KEY = 'tasklog_notif_lastCheck'

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export function checkAndNotify(tasks: Task[]): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const lastCheck = localStorage.getItem(NOTIF_KEY)
  const now = Date.now()
  // Only fire once per hour at most
  if (lastCheck && now - parseInt(lastCheck) < 60 * 60 * 1000) return
  localStorage.setItem(NOTIF_KEY, String(now))

  const todayStr = today()
  const dueTasks = tasks.filter(t => {
    if (t.isRecurring) return isRecurringOnDate(t, todayStr)
    return !t.completed && t.dueDate === todayStr
  })

  if (dueTasks.length === 0) return

  const urgent = dueTasks.filter(t => t.priority === 'urgent')
  const title = urgent.length
    ? `🔴 ${urgent[0].title}${urgent.length > 1 ? ` +${urgent.length - 1} more urgent` : ''}`
    : `📋 ${dueTasks.length} task${dueTasks.length > 1 ? 's' : ''} today`

  const body = dueTasks
    .slice(0, 5)
    .map(t => `• ${t.title}`)
    .join('\n')

  const n = new Notification(title, {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    tag: 'tasklog-daily',
    renotify: true,
  })

  n.onclick = () => { window.focus(); n.close() }
}

export function scheduleNotifications(tasks: Task[]): () => void {
  // Fire on load
  checkAndNotify(tasks)

  // Re-check every 30 minutes while app is open
  const interval = setInterval(() => checkAndNotify(tasks), 30 * 60 * 1000)
  return () => clearInterval(interval)
}
