import { create } from 'zustand'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { TodoColor } from '@/lib/types'
import { dayKey } from '@/lib/dates'

export interface FriendProfile {
  id: string
  username: string
  displayName: string
  avatarColor: TodoColor
}

export interface Friend {
  friendshipId: string
  status: 'pending' | 'accepted'
  direction: 'incoming' | 'outgoing' | 'friends'
  profile: FriendProfile
  progress?: { done: number; total: number; lastTitle?: string }
}

interface FriendsState {
  friends: Friend[]
  loading: boolean
  message: string | null
  load: (userId: string) => Promise<void>
  addByUsername: (username: string) => Promise<void>
  respond: (friendshipId: string, accept: boolean) => Promise<void>
  remove: (friendshipId: string) => Promise<void>
  subscribe: (userId: string) => void
  unsubscribe: () => void
  clearMessage: () => void
}

let channel: RealtimeChannel | null = null

async function fetchProgress(friendId: string) {
  if (!supabase) return undefined
  const today = dayKey()
  const { data } = await supabase
    .from('todos')
    .select('title, completed, completed_at')
    .eq('user_id', friendId)
    .eq('day', today)
  if (!data) return { done: 0, total: 0 }
  const done = data.filter((d) => d.completed).length
  const last = data
    .filter((d) => d.completed && d.completed_at)
    .sort((a, b) => (a.completed_at! < b.completed_at! ? 1 : -1))[0]
  return { done, total: data.length, lastTitle: last?.title as string | undefined }
}

export const useFriends = create<FriendsState>((set, get) => ({
  friends: [],
  loading: false,
  message: null,

  load: async (userId) => {
    if (!supabase) return
    set({ loading: true })
    const { data: rows } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)

    const others = (rows ?? []).map((r) => (r.user_id === userId ? r.friend_id : r.user_id))
    const { data: profiles } = others.length
      ? await supabase.from('profiles').select('*').in('id', others)
      : { data: [] as any[] }
    const pMap = new Map((profiles ?? []).map((p) => [p.id, p]))

    const friends: Friend[] = []
    for (const r of rows ?? []) {
      const otherId = r.user_id === userId ? r.friend_id : r.user_id
      const p = pMap.get(otherId)
      if (!p) continue
      const direction: Friend['direction'] =
        r.status === 'accepted' ? 'friends' : r.user_id === userId ? 'outgoing' : 'incoming'
      const friend: Friend = {
        friendshipId: r.id,
        status: r.status,
        direction,
        profile: {
          id: p.id,
          username: p.username,
          displayName: p.display_name,
          avatarColor: (p.avatar_color as TodoColor) ?? 'violet',
        },
      }
      if (r.status === 'accepted') friend.progress = await fetchProgress(otherId)
      friends.push(friend)
    }
    set({ friends, loading: false })
  },

  addByUsername: async (username) => {
    if (!supabase) return
    const me = (await supabase.auth.getUser()).data.user
    if (!me) return
    const clean = username.trim().replace(/^@/, '')
    if (!clean) return
    const { data: found } = await supabase.rpc('find_user_by_username', { uname: clean })
    const target = found?.[0]
    if (!target) return set({ message: `No user named “${clean}”.` })
    if (target.id === me.id) return set({ message: "That's you! 🙂" })
    const { error } = await supabase
      .from('friendships')
      .insert({ user_id: me.id, friend_id: target.id, status: 'pending' })
    if (error) return set({ message: error.message.includes('duplicate') ? 'Request already exists.' : error.message })
    set({ message: `Request sent to ${target.display_name} ✅` })
    await get().load(me.id)
  },

  respond: async (friendshipId, accept) => {
    if (!supabase) return
    if (accept) {
      await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
    } else {
      await supabase.from('friendships').delete().eq('id', friendshipId)
    }
    const me = (await supabase.auth.getUser()).data.user
    if (me) await get().load(me.id)
  },

  remove: async (friendshipId) => {
    if (!supabase) return
    await supabase.from('friendships').delete().eq('id', friendshipId)
    const me = (await supabase.auth.getUser()).data.user
    if (me) await get().load(me.id)
  },

  subscribe: (userId) => {
    if (!supabase || channel) return
    const reload = () => get().load(userId)
    channel = supabase
      .channel(`friends:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, (payload) => {
        const uid = (payload.new as any)?.user_id ?? (payload.old as any)?.user_id
        if (get().friends.some((f) => f.status === 'accepted' && f.profile.id === uid)) reload()
      })
      .subscribe()
  },

  unsubscribe: () => {
    if (channel) {
      supabase?.removeChannel(channel)
      channel = null
    }
  },

  clearMessage: () => set({ message: null }),
}))
