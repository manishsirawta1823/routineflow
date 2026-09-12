// ── Core domain types ──────────────────────────────────────────

export type TodoColor =
  | 'violet'
  | 'blue'
  | 'cyan'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'pink'
  | 'orange'

export interface Category {
  id: string
  name: string
  emoji: string
  color: TodoColor
}

export interface Todo {
  id: string
  /** ISO date string YYYY-MM-DD this todo belongs to */
  date: string
  title: string
  note?: string
  color: TodoColor
  categoryId?: string
  /** optional scheduled time HH:mm for reminders */
  time?: string
  completed: boolean
  completedAt?: string | null
  /** for ordering within a day */
  order: number
  /** if generated from a recurring routine template */
  routineId?: string
  createdAt: string
}

/** Recurring routine template that auto-populates each matching day. */
export interface Routine {
  id: string
  title: string
  note?: string
  color: TodoColor
  categoryId?: string
  time?: string
  /** 0=Sun ... 6=Sat. Empty = every day. */
  daysOfWeek: number[]
  active: boolean
  createdAt: string
}

export interface Profile {
  id: string
  username: string
  displayName: string
  avatarColor: TodoColor
  bio?: string
  createdAt: string
}

export type FriendStatus = 'pending' | 'accepted'

export interface Friendship {
  id: string
  userId: string
  friendId: string
  status: FriendStatus
  createdAt: string
}

/** Per-day planner extras: goal & free-form notes. */
export interface DayMeta {
  goal?: string
  notes?: string
}

/** Aggregated stats for a single day. */
export interface DayStat {
  date: string
  total: number
  completed: number
  rate: number // 0..1
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  remindersEnabled: boolean
  reminderLeadMinutes: number
  weekStartsOn: 0 | 1 // 0 Sun, 1 Mon
}
