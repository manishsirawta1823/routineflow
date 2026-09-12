import type { Category, DayStat, Todo } from './types'
import { dayKey } from './dates'

/** Completion stats for a set of day-keys. */
export function dayStats(todos: Todo[], keys: string[]): DayStat[] {
  const byDay = new Map<string, Todo[]>()
  for (const k of keys) byDay.set(k, [])
  for (const t of todos) {
    if (byDay.has(t.date)) byDay.get(t.date)!.push(t)
  }
  return keys.map((date) => {
    const list = byDay.get(date) ?? []
    const total = list.length
    const completed = list.filter((t) => t.completed).length
    return { date, total, completed, rate: total ? completed / total : 0 }
  })
}

export interface Summary {
  total: number
  completed: number
  rate: number
  activeDays: number
  perfectDays: number
  bestDay: DayStat | null
}

export function summarize(stats: DayStat[]): Summary {
  const total = stats.reduce((a, s) => a + s.total, 0)
  const completed = stats.reduce((a, s) => a + s.completed, 0)
  const activeDays = stats.filter((s) => s.total > 0).length
  const perfectDays = stats.filter((s) => s.total > 0 && s.completed === s.total).length
  let bestDay: DayStat | null = null
  for (const s of stats) {
    if (s.total === 0) continue
    if (!bestDay || s.rate > bestDay.rate || (s.rate === bestDay.rate && s.completed > bestDay.completed)) {
      bestDay = s
    }
  }
  return {
    total,
    completed,
    rate: total ? completed / total : 0,
    activeDays,
    perfectDays,
    bestDay,
  }
}

/** Current consecutive-day streak of >=1 completion, counting back from today. */
export function currentStreak(todos: Todo[]): number {
  const completedDates = new Set(todos.filter((t) => t.completed).map((t) => t.date))
  let streak = 0
  const d = new Date()
  // allow today to be "in progress": if today has none completed yet, start from yesterday
  if (!completedDates.has(dayKey(d))) d.setDate(d.getDate() - 1)
  while (completedDates.has(dayKey(d))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export function longestStreak(todos: Todo[]): number {
  const dates = [...new Set(todos.filter((t) => t.completed).map((t) => t.date))].sort()
  let best = 0
  let run = 0
  let prev: Date | null = null
  for (const key of dates) {
    const d = new Date(key)
    if (prev && (d.getTime() - prev.getTime()) / 86400000 === 1) run++
    else run = 1
    best = Math.max(best, run)
    prev = d
  }
  return best
}

export interface CatSlice {
  category: Category | { id: string; name: string; emoji: string; color: 'violet' }
  total: number
  completed: number
  rate: number
}

export function byCategory(todos: Todo[], categories: Category[]): CatSlice[] {
  const map = new Map<string, { total: number; completed: number }>()
  for (const t of todos) {
    const key = t.categoryId ?? 'none'
    const cur = map.get(key) ?? { total: 0, completed: 0 }
    cur.total++
    if (t.completed) cur.completed++
    map.set(key, cur)
  }
  const slices: CatSlice[] = []
  for (const [key, v] of map) {
    const cat =
      categories.find((c) => c.id === key) ??
      ({ id: 'none', name: 'Uncategorised', emoji: '•', color: 'violet' } as const)
    slices.push({ category: cat, total: v.total, completed: v.completed, rate: v.total ? v.completed / v.total : 0 })
  }
  return slices.sort((a, b) => b.total - a.total)
}

/** Short human grade for a completion rate. */
export function grade(rate: number): { letter: string; label: string; color: string } {
  if (rate >= 0.9) return { letter: 'A+', label: 'Outstanding', color: '52 211 153' }
  if (rate >= 0.8) return { letter: 'A', label: 'Excellent', color: '52 211 153' }
  if (rate >= 0.7) return { letter: 'B', label: 'Great', color: '59 130 246' }
  if (rate >= 0.6) return { letter: 'C', label: 'Good', color: '251 191 36' }
  if (rate >= 0.4) return { letter: 'D', label: 'Keep going', color: '251 146 60' }
  return { letter: 'E', label: 'Just start', color: '244 63 94' }
}
