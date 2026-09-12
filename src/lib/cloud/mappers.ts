import type { Todo, Routine, TodoColor } from '@/lib/types'

// ── Todo <-> DB row ───────────────────────────────────────────
export interface TodoRow {
  id: string
  user_id: string
  day: string
  title: string
  note: string | null
  color: string
  category_id: string | null
  time: string | null
  completed: boolean
  completed_at: string | null
  sort_order: number
  routine_id: string | null
  created_at: string
}

export function todoToRow(t: Todo, userId: string): TodoRow {
  return {
    id: t.id,
    user_id: userId,
    day: t.date,
    title: t.title,
    note: t.note ?? null,
    color: t.color,
    category_id: t.categoryId ?? null,
    time: t.time ?? null,
    completed: t.completed,
    completed_at: t.completedAt ?? null,
    sort_order: t.order,
    routine_id: t.routineId ?? null,
    created_at: t.createdAt,
  }
}

export function rowToTodo(r: TodoRow): Todo {
  return {
    id: r.id,
    date: r.day,
    title: r.title,
    note: r.note ?? undefined,
    color: r.color as TodoColor,
    categoryId: r.category_id ?? undefined,
    time: r.time ?? undefined,
    completed: r.completed,
    completedAt: r.completed_at,
    order: r.sort_order,
    routineId: r.routine_id ?? undefined,
    createdAt: r.created_at,
  }
}

// ── Routine <-> DB row ────────────────────────────────────────
export interface RoutineRow {
  id: string
  user_id: string
  title: string
  note: string | null
  color: string
  category_id: string | null
  time: string | null
  days_of_week: number[]
  active: boolean
  created_at: string
}

export function routineToRow(r: Routine, userId: string): RoutineRow {
  return {
    id: r.id,
    user_id: userId,
    title: r.title,
    note: r.note ?? null,
    color: r.color,
    category_id: r.categoryId ?? null,
    time: r.time ?? null,
    days_of_week: r.daysOfWeek,
    active: r.active,
    created_at: r.createdAt,
  }
}

export function rowToRoutine(r: RoutineRow): Routine {
  return {
    id: r.id,
    title: r.title,
    note: r.note ?? undefined,
    color: r.color as TodoColor,
    categoryId: r.category_id ?? undefined,
    time: r.time ?? undefined,
    daysOfWeek: r.days_of_week ?? [],
    active: r.active,
    createdAt: r.created_at,
  }
}
