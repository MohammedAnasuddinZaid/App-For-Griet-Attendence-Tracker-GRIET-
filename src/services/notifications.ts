// Notification abstraction. Browser Notification API, local-only scheduling.
// Never request permission on first launch. Quiet hours respected.
import type { AppSettings } from '@/types'

export type NotificationCategory = 'NEXT_CLASS' | 'DAILY_SUMMARY' | 'HOLIDAY' | 'SPECIAL_CLASS' | 'ATTENDANCE_WARNING' | 'BACKUP_REMINDER'

export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

export function isSupported(): boolean {
  return 'Notification' in window
}

export function inQuietHours(settings: AppSettings | null, now: Date = new Date()): boolean {
  if (!settings?.quietHours?.enabled) return false
  const start = settings.quietHours.start
  const end = settings.quietHours.end
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const minutes = now.getHours() * 60 + now.getMinutes()
  const sMin = (sh ?? 0) * 60 + (sm ?? 0)
  const eMin = (eh ?? 0) * 60 + (em ?? 0)
  if (sMin === eMin) return false
  if (sMin < eMin) return minutes >= sMin && minutes < eMin
  return minutes >= sMin || minutes < eMin
}

export async function showNotification(
  title: string,
  opts: { body?: string; icon?: string; tag?: string; data?: unknown } = {},
  settings: AppSettings | null,
  force = false
): Promise<boolean> {
  if (!isSupported()) return false
  if (Notification.permission !== 'granted') return false
  if (!force && settings && inQuietHours(settings)) return false
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) {
      await reg.showNotification(title, { body: opts.body, icon: opts.icon ?? '/icons/icon-192.png', tag: opts.tag, data: opts.data })
    } else {
      new Notification(title, { body: opts.body, icon: opts.icon })
    }
    return true
  } catch {
    return false
  }
}

// Fire a test notification from Settings.
export async function sendTestNotification(settings: AppSettings): Promise<{ ok: boolean; message: string }> {
  if (!isSupported()) {
    return { ok: false, message: 'Your current browser/device does not support notifications.' }
  }
  const perm = await getNotificationPermission()
  if (perm === 'denied') {
    return { ok: false, message: 'Notifications are blocked by your browser. Enable them in site settings.' }
  }
  if (perm === 'granted') {
    await showNotification('GRIET Attendance', { body: 'Notifications are working. ✅' }, settings, true)
    return { ok: true, message: 'Test notification sent.' }
  }
  const result = await requestNotificationPermission()
  if (result === 'granted') {
    await showNotification('GRIET Attendance', { body: 'Notifications are working. ✅' }, settings, true)
    return { ok: true, message: 'Test notification sent.' }
  }
  return { ok: false, message: 'Notification permission was not granted.' }
}

// Throttle identical warnings: don't re-send same category+subject within 1 day.
export async function shouldNotify(category: NotificationCategory, subjectId?: string, profileId?: string): Promise<boolean> {
  if (!profileId) return true
  const key = `griet-notify-${profileId}-${category}-${subjectId ?? ''}`
  const last = localStorage.getItem(key)
  if (last) {
    const diff = Date.now() - Number(last)
    if (diff < 24 * 60 * 60 * 1000) return false
  }
  localStorage.setItem(key, String(Date.now()))
  return true
}

export function reminderLabel(minutes: number): string {
  return `${minutes} min before class`
}

// Next-class reminder scheduling: compute delay in ms from now.
export function minutesUntilClass(startTime: string, reminderMinutes: number): number {
  const [h, m] = startTime.split(':').map(Number)
  const now = new Date()
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h ?? 0, (m ?? 0) - reminderMinutes)
  const delay = target.getTime() - now.getTime()
  return delay
}