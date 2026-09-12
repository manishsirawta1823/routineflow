import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { dayKey } from '@/lib/dates'

/**
 * Schedules in-app reminders while the app is open. Real background push
 * (app closed) arrives in Phase 2 via a service worker + Supabase.
 */
export function useReminders() {
  const todos = useStore((s) => s.todos)
  const { remindersEnabled, reminderLeadMinutes } = useStore((s) => s.settings)

  useEffect(() => {
    if (!remindersEnabled) return
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const today = dayKey()
    const now = Date.now()
    const timers: number[] = []

    for (const t of todos) {
      if (t.date !== today || t.completed || !t.time) continue
      const [h, m] = t.time.split(':').map(Number)
      const when = new Date()
      when.setHours(h, m - reminderLeadMinutes, 0, 0)
      const delay = when.getTime() - now
      if (delay <= 0 || delay > 24 * 3600 * 1000) continue

      const id = window.setTimeout(() => {
        try {
          new Notification('⏰ ' + t.title, {
            body: reminderLeadMinutes > 0 ? `Starting in ${reminderLeadMinutes} min` : 'Time to start',
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            tag: t.id,
          })
        } catch {
          /* noop */
        }
      }, delay)
      timers.push(id)
    }

    return () => timers.forEach((id) => clearTimeout(id))
  }, [todos, remindersEnabled, reminderLeadMinutes])
}
