import type { Todo, Routine } from '@/lib/types'

/**
 * Decouples the Zustand store from Supabase. The store fires these
 * handlers after each mutation; the sync layer (sync.ts) fills them in
 * once a user is signed in. When `userId` is null the app is local-only
 * and every handler is a no-op.
 */
interface CloudBridge {
  userId: string | null
  upsertTodo?: (t: Todo) => void
  deleteTodo?: (id: string) => void
  upsertRoutine?: (r: Routine) => void
  deleteRoutine?: (id: string) => void
  upsertDayMeta?: (date: string, meta: { goal?: string; notes?: string }) => void
  /** guards against echoing realtime-applied changes back to the server */
  applyingRemote: boolean
}

export const cloud: CloudBridge = {
  userId: null,
  applyingRemote: false,
}
