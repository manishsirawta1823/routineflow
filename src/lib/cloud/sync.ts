import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import type { DayMeta } from '@/lib/types'
import { cloud } from './bridge'
import {
  todoToRow,
  rowToTodo,
  routineToRow,
  rowToRoutine,
  type TodoRow,
  type RoutineRow,
} from './mappers'

let channel: RealtimeChannel | null = null

/** Register write handlers so store mutations mirror to Supabase. */
export function registerCloudWriters(userId: string) {
  cloud.userId = userId

  cloud.upsertTodo = (t) => {
    supabase?.from('todos').upsert(todoToRow(t, userId)).then(({ error }) => {
      if (error) console.warn('[sync] upsert todo', error.message)
    })
  }
  cloud.deleteTodo = (id) => {
    supabase?.from('todos').delete().eq('user_id', userId).eq('id', id).then(({ error }) => {
      if (error) console.warn('[sync] delete todo', error.message)
    })
  }
  cloud.upsertRoutine = (r) => {
    supabase?.from('routines').upsert(routineToRow(r, userId)).then(({ error }) => {
      if (error) console.warn('[sync] upsert routine', error.message)
    })
  }
  cloud.deleteRoutine = (id) => {
    supabase?.from('routines').delete().eq('user_id', userId).eq('id', id).then(({ error }) => {
      if (error) console.warn('[sync] delete routine', error.message)
    })
  }
  cloud.upsertDayMeta = (date, meta) => {
    supabase
      ?.from('day_meta')
      .upsert({ user_id: userId, day: date, goal: meta.goal ?? null, notes: meta.notes ?? null })
      .then(({ error }) => {
        if (error) console.warn('[sync] upsert day_meta', error.message)
      })
  }
}

export function clearCloudWriters() {
  cloud.userId = null
  cloud.upsertTodo = undefined
  cloud.deleteTodo = undefined
  cloud.upsertRoutine = undefined
  cloud.deleteRoutine = undefined
  cloud.upsertDayMeta = undefined
}

/**
 * Pull the user's cloud data into the store. On a brand-new account with
 * local data already present, push the local data up first (migration).
 */
export async function pullFromCloud(userId: string) {
  if (!supabase) return
  const [{ data: todoRows }, { data: routineRows }, { data: metaRows }] = await Promise.all([
    supabase.from('todos').select('*').eq('user_id', userId),
    supabase.from('routines').select('*').eq('user_id', userId),
    supabase.from('day_meta').select('*').eq('user_id', userId),
  ])

  const cloudEmpty = !todoRows?.length && !routineRows?.length && !metaRows?.length
  const local = useStore.getState()

  if (cloudEmpty && (local.todos.length || local.routines.length)) {
    // First sign-in: migrate existing local data up to the cloud.
    await Promise.all([
      local.todos.length
        ? supabase.from('todos').upsert(local.todos.map((t) => todoToRow(t, userId)))
        : Promise.resolve(),
      local.routines.length
        ? supabase.from('routines').upsert(local.routines.map((r) => routineToRow(r, userId)))
        : Promise.resolve(),
      Object.keys(local.dayMeta).length
        ? supabase.from('day_meta').upsert(
            Object.entries(local.dayMeta).map(([day, m]) => ({
              user_id: userId,
              day,
              goal: m.goal ?? null,
              notes: m.notes ?? null,
            })),
          )
        : Promise.resolve(),
    ])
    return // store already holds this data
  }

  const dayMeta: Record<string, DayMeta> = {}
  for (const m of metaRows ?? []) dayMeta[m.day] = { goal: m.goal ?? undefined, notes: m.notes ?? undefined }

  useStore.getState().hydrateFromCloud({
    todos: (todoRows as TodoRow[] | null ?? []).map(rowToTodo),
    routines: (routineRows as RoutineRow[] | null ?? []).map(rowToRoutine),
    dayMeta,
  })
}

/** Subscribe to this user's own todos so edits on other devices appear live. */
export function startRealtime(userId: string) {
  if (!supabase || channel) return
  channel = supabase
    .channel(`todos:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'todos', filter: `user_id=eq.${userId}` },
      (payload) => {
        const store = useStore.getState()
        if (payload.eventType === 'DELETE') {
          store.applyRemoteTodoDelete((payload.old as { id: string }).id)
        } else {
          store.applyRemoteTodo(rowToTodo(payload.new as TodoRow))
        }
      },
    )
    .subscribe()
}

export function stopRealtime() {
  if (channel) {
    supabase?.removeChannel(channel)
    channel = null
  }
}
