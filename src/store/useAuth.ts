import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase, isCloudEnabled } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import type { TodoColor } from '@/lib/types'
import {
  registerCloudWriters,
  clearCloudWriters,
  pullFromCloud,
  startRealtime,
  stopRealtime,
} from '@/lib/cloud/sync'

type Status = 'loading' | 'signedOut' | 'signedIn'

interface AuthState {
  user: User | null
  status: Status
  error: string | null
  signUp: (
    email: string,
    password: string,
    name: string,
    username: string,
  ) => Promise<{ ok: boolean; needsConfirm: boolean }>
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  clearError: () => void
}

async function loadProfile(userId: string) {
  if (!supabase) return
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (data) {
    useStore.getState().setProfile({
      id: data.id,
      username: data.username,
      displayName: data.display_name,
      avatarColor: (data.avatar_color as TodoColor) ?? 'violet',
      bio: data.bio ?? undefined,
      createdAt: data.created_at,
    })
  }
}

async function onSignedIn(user: User) {
  registerCloudWriters(user.id)
  await loadProfile(user.id)
  await pullFromCloud(user.id)
  startRealtime(user.id)
}

function onSignedOut() {
  stopRealtime()
  clearCloudWriters()
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: isCloudEnabled ? 'loading' : 'signedOut',
  error: null,

  signUp: async (email, password, name, username) => {
    if (!supabase) return { ok: false, needsConfirm: false }
    set({ error: null })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name, username: username.toLowerCase().replace(/\s+/g, '_') } },
    })
    if (error) {
      set({ error: error.message })
      return { ok: false, needsConfirm: false }
    }
    // When email confirmation is OFF, Supabase returns a live session and the
    // SIGNED_IN listener signs the user in. When ON, there's no session yet.
    return { ok: true, needsConfirm: !data.session }
  },

  signIn: async (email, password) => {
    if (!supabase) return false
    set({ error: null })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ error: error.message })
      return false
    }
    return true
  },

  signOut: async () => {
    await supabase?.auth.signOut()
  },

  clearError: () => set({ error: null }),
}))

/** Call once at startup to wire Supabase auth → app state. */
export function initAuth() {
  if (!supabase) return
  supabase.auth.getSession().then(({ data }) => {
    const user = data.session?.user ?? null
    if (user) {
      onSignedIn(user).finally(() => useAuth.setState({ user, status: 'signedIn' }))
    } else {
      useAuth.setState({ status: 'signedOut' })
    }
  })

  supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user ?? null
    if (event === 'SIGNED_IN' && user) {
      onSignedIn(user).finally(() => useAuth.setState({ user, status: 'signedIn' }))
    } else if (event === 'SIGNED_OUT') {
      onSignedOut()
      useAuth.setState({ user: null, status: 'signedOut' })
    }
  })
}
