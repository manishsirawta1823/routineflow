import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AppSettings,
  Category,
  DayMeta,
  Profile,
  Routine,
  Todo,
  TodoColor,
} from '@/lib/types'
import { uid } from '@/lib/utils'
import { dayKey, weekdayIndex } from '@/lib/dates'
import { cloud } from '@/lib/cloud/bridge'

const canSync = () => cloud.userId && !cloud.applyingRemote

// ── Defaults ──────────────────────────────────────────────────

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-health', name: 'Health', emoji: '💪', color: 'emerald' },
  { id: 'cat-work', name: 'Work', emoji: '💼', color: 'blue' },
  { id: 'cat-study', name: 'Study', emoji: '📚', color: 'violet' },
  { id: 'cat-mind', name: 'Mind', emoji: '🧘', color: 'cyan' },
  { id: 'cat-personal', name: 'Personal', emoji: '🌱', color: 'rose' },
  { id: 'cat-fun', name: 'Fun', emoji: '🎮', color: 'orange' },
]

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  remindersEnabled: false,
  reminderLeadMinutes: 10,
  weekStartsOn: 1,
}

function seedTodos(): Todo[] {
  const today = dayKey()
  const base = [
    { title: 'Morning workout', color: 'emerald' as TodoColor, categoryId: 'cat-health', time: '06:30' },
    { title: 'Read 20 pages', color: 'violet' as TodoColor, categoryId: 'cat-study', time: '08:00' },
    { title: 'Deep work session', color: 'blue' as TodoColor, categoryId: 'cat-work', time: '10:00' },
    { title: 'Meditate 10 min', color: 'cyan' as TodoColor, categoryId: 'cat-mind', time: '18:00' },
    { title: 'Journal the day', color: 'rose' as TodoColor, categoryId: 'cat-personal', time: '21:30' },
  ]
  return base.map((b, i) => ({
    id: uid('t-'),
    date: today,
    title: b.title,
    color: b.color,
    categoryId: b.categoryId,
    time: b.time,
    completed: i < 2,
    completedAt: i < 2 ? new Date().toISOString() : null,
    order: i,
    createdAt: new Date().toISOString(),
  }))
}

// ── Store shape ───────────────────────────────────────────────

interface State {
  profile: Profile | null
  categories: Category[]
  todos: Todo[]
  routines: Routine[]
  settings: AppSettings
  dayMeta: Record<string, DayMeta>
  seeded: boolean

  // profile
  setProfile: (p: Profile | null) => void

  // per-day goal & notes
  setDayMeta: (date: string, patch: Partial<DayMeta>) => void

  // todos
  addTodo: (input: Partial<Todo> & { title: string; date: string }) => void
  updateTodo: (id: string, patch: Partial<Todo>) => void
  toggleTodo: (id: string) => void
  deleteTodo: (id: string) => void
  reorderTodos: (date: string, orderedIds: string[]) => void
  todosForDate: (date: string) => Todo[]

  // routines
  addRoutine: (input: Partial<Routine> & { title: string }) => void
  updateRoutine: (id: string, patch: Partial<Routine>) => void
  deleteRoutine: (id: string) => void
  materializeRoutines: (date: string) => void

  // cloud hydration / realtime (do NOT re-sync)
  hydrateFromCloud: (data: { todos: Todo[]; routines: Routine[]; dayMeta: Record<string, DayMeta> }) => void
  applyRemoteTodo: (todo: Todo) => void
  applyRemoteTodoDelete: (id: string) => void

  // categories
  addCategory: (c: Omit<Category, 'id'>) => void
  deleteCategory: (id: string) => void

  // settings
  updateSettings: (patch: Partial<AppSettings>) => void

  resetAll: () => void
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      profile: null,
      categories: DEFAULT_CATEGORIES,
      todos: [],
      routines: [],
      settings: DEFAULT_SETTINGS,
      dayMeta: {},
      seeded: false,

      setProfile: (p) => set({ profile: p }),

      setDayMeta: (date, patch) => {
        set((s) => ({
          dayMeta: { ...s.dayMeta, [date]: { ...s.dayMeta[date], ...patch } },
        }))
        if (canSync()) cloud.upsertDayMeta?.(date, get().dayMeta[date])
      },

      addTodo: (input) => {
        const dayTodos = get().todos.filter((t) => t.date === input.date)
        const todo: Todo = {
          id: input.id ?? uid('t-'),
          date: input.date,
          title: input.title.trim(),
          note: input.note,
          color: input.color ?? 'violet',
          categoryId: input.categoryId,
          time: input.time,
          completed: input.completed ?? false,
          completedAt: input.completedAt ?? null,
          order: input.order ?? dayTodos.length,
          routineId: input.routineId,
          createdAt: input.createdAt ?? new Date().toISOString(),
        }
        set((s) => ({ todos: [...s.todos, todo] }))
        if (canSync()) cloud.upsertTodo?.(todo)
      },

      updateTodo: (id, patch) => {
        set((s) => ({
          todos: s.todos.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }))
        const todo = get().todos.find((t) => t.id === id)
        if (todo && canSync()) cloud.upsertTodo?.(todo)
      },

      toggleTodo: (id) => {
        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === id
              ? {
                  ...t,
                  completed: !t.completed,
                  completedAt: !t.completed ? new Date().toISOString() : null,
                }
              : t,
          ),
        }))
        const todo = get().todos.find((t) => t.id === id)
        if (todo && canSync()) cloud.upsertTodo?.(todo)
      },

      deleteTodo: (id) => {
        set((s) => ({ todos: s.todos.filter((t) => t.id !== id) }))
        if (canSync()) cloud.deleteTodo?.(id)
      },

      reorderTodos: (date, orderedIds) => {
        set((s) => ({
          todos: s.todos.map((t) => {
            if (t.date !== date) return t
            const order = orderedIds.indexOf(t.id)
            return order === -1 ? t : { ...t, order }
          }),
        }))
        if (canSync()) {
          const updated = get().todos.filter((t) => t.date === date)
          updated.forEach((t) => cloud.upsertTodo?.(t))
        }
      },

      todosForDate: (date) =>
        get()
          .todos.filter((t) => t.date === date)
          .sort((a, b) => a.order - b.order),

      addRoutine: (input) => {
        const routine: Routine = {
          id: input.id ?? uid('r-'),
          title: input.title.trim(),
          note: input.note,
          color: input.color ?? 'violet',
          categoryId: input.categoryId,
          time: input.time,
          daysOfWeek: input.daysOfWeek ?? [],
          active: input.active ?? true,
          createdAt: input.createdAt ?? new Date().toISOString(),
        }
        set((s) => ({ routines: [...s.routines, routine] }))
        if (canSync()) cloud.upsertRoutine?.(routine)
      },

      updateRoutine: (id, patch) => {
        set((s) => ({
          routines: s.routines.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        }))
        const routine = get().routines.find((r) => r.id === id)
        if (routine && canSync()) cloud.upsertRoutine?.(routine)
      },

      deleteRoutine: (id) => {
        set((s) => ({ routines: s.routines.filter((r) => r.id !== id) }))
        if (canSync()) cloud.deleteRoutine?.(id)
      },

      materializeRoutines: (date) => {
        const s = get()
        const wd = weekdayIndex(date)
        const existing = new Set(
          s.todos.filter((t) => t.date === date && t.routineId).map((t) => t.routineId),
        )
        const dayCount = s.todos.filter((t) => t.date === date).length
        const toAdd: Todo[] = []
        s.routines
          .filter((r) => r.active)
          .filter((r) => r.daysOfWeek.length === 0 || r.daysOfWeek.includes(wd))
          .filter((r) => !existing.has(r.id))
          .forEach((r, i) => {
            toAdd.push({
              id: uid('t-'),
              date,
              title: r.title,
              note: r.note,
              color: r.color,
              categoryId: r.categoryId,
              time: r.time,
              completed: false,
              completedAt: null,
              order: dayCount + i,
              routineId: r.id,
              createdAt: new Date().toISOString(),
            })
          })
        if (!toAdd.length) return
        set((st) => ({ todos: [...st.todos, ...toAdd] }))
        if (canSync()) toAdd.forEach((t) => cloud.upsertTodo?.(t))
      },

      hydrateFromCloud: (data) =>
        set({ todos: data.todos, routines: data.routines, dayMeta: data.dayMeta }),

      applyRemoteTodo: (todo) =>
        set((s) => {
          const exists = s.todos.some((t) => t.id === todo.id)
          return {
            todos: exists ? s.todos.map((t) => (t.id === todo.id ? todo : t)) : [...s.todos, todo],
          }
        }),

      applyRemoteTodoDelete: (id) =>
        set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),

      addCategory: (c) =>
        set((s) => ({ categories: [...s.categories, { ...c, id: uid('cat-') }] })),

      deleteCategory: (id) =>
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      resetAll: () =>
        set({
          todos: [],
          routines: [],
          categories: DEFAULT_CATEGORIES,
          settings: DEFAULT_SETTINGS,
          dayMeta: {},
          seeded: false,
          profile: null,
        }),
    }),
    {
      name: 'routineflow-v1',
      onRehydrateStorage: () => (state) => {
        // one-time demo seed so the app is never empty on first open
        if (state && !state.seeded) {
          state.todos = seedTodos()
          state.seeded = true
        }
      },
    },
  ),
)
