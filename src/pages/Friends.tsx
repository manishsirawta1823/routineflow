import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Radio, UserPlus, Lock, Check, X, Clock, LogIn, Users } from 'lucide-react'
import { isCloudEnabled } from '@/lib/supabase'
import { useAuth } from '@/store/useAuth'
import { useFriends, type Friend } from '@/store/useFriends'
import { useUI } from '@/store/useUI'
import { COLORS } from '@/lib/colors'
import { pct, haptic } from '@/lib/utils'

export function Friends() {
  const status = useAuth((s) => s.status)
  const user = useAuth((s) => s.user)
  const setAuthOpen = useUI((s) => s.setAuthOpen)
  const { friends, loading, message, load, subscribe, unsubscribe, addByUsername, respond, remove, clearMessage } =
    useFriends()
  const [username, setUsername] = useState('')

  useEffect(() => {
    if (status === 'signedIn' && user) {
      load(user.id)
      subscribe(user.id)
      return () => unsubscribe()
    }
  }, [status, user, load, subscribe, unsubscribe])

  useEffect(() => {
    if (!message) return
    const t = setTimeout(clearMessage, 3500)
    return () => clearTimeout(t)
  }, [message, clearMessage])

  const accepted = friends.filter((f) => f.direction === 'friends')
  const incoming = friends.filter((f) => f.direction === 'incoming')
  const outgoing = friends.filter((f) => f.direction === 'outgoing')

  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-[max(env(safe-area-inset-top),1.25rem)]">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-script text-3xl text-content">Friends</h1>
          <p className="text-sm text-muted">See routines update live.</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-500">
          <Radio size={13} className="animate-pulse" /> Live
        </div>
      </header>

      {/* Not configured → preview */}
      {!isCloudEnabled && <PreviewGate />}

      {/* Configured but signed out → sign-in prompt */}
      {isCloudEnabled && status !== 'signedIn' && (
        <div className="rounded-3xl border border-border bg-surface p-6 text-center shadow-soft">
          <div
            className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl text-white"
            style={{ background: 'linear-gradient(135deg, rgb(196 181 253), rgb(249 168 212))' }}
          >
            <Users size={26} />
          </div>
          <p className="font-script text-xl text-content">Sign in to add friends</p>
          <p className="mb-4 text-sm text-muted">Share your routine and watch each other's day fill in live.</p>
          <button
            onClick={() => {
              haptic()
              setAuthOpen(true)
            }}
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-bold text-white shadow-glow"
            style={{ backgroundImage: 'linear-gradient(135deg, rgb(196 181 253), rgb(249 168 212))' }}
          >
            <LogIn size={18} /> Sign in
          </button>
        </div>
      )}

      {/* Signed in → real friends */}
      {isCloudEnabled && status === 'signedIn' && (
        <>
          <div className="mb-5 flex gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-border bg-surface px-3.5 shadow-soft focus-within:border-brand">
              <span className="text-muted">@</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && username.trim() && (addByUsername(username), setUsername(''))}
                placeholder="friend's username"
                className="input"
              />
            </div>
            <button
              onClick={() => {
                if (!username.trim()) return
                addByUsername(username)
                setUsername('')
                haptic()
              }}
              className="flex items-center gap-1.5 rounded-2xl px-4 font-bold text-white shadow-glow"
              style={{ backgroundImage: 'linear-gradient(135deg, rgb(196 181 253), rgb(249 168 212))' }}
            >
              <UserPlus size={17} /> Add
            </button>
          </div>

          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 rounded-2xl bg-brand/15 px-4 py-2.5 text-sm font-semibold text-brand"
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* incoming requests */}
          {incoming.length > 0 && (
            <Section title="Requests">
              {incoming.map((f) => (
                <div key={f.friendshipId} className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
                  <Avatar f={f} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{f.profile.displayName}</p>
                    <p className="text-xs text-muted">@{f.profile.username}</p>
                  </div>
                  <button
                    onClick={() => respond(f.friendshipId, true)}
                    className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500 text-white"
                  >
                    <Check size={17} />
                  </button>
                  <button
                    onClick={() => respond(f.friendshipId, false)}
                    className="grid h-9 w-9 place-items-center rounded-full bg-surface text-muted"
                  >
                    <X size={17} />
                  </button>
                </div>
              ))}
            </Section>
          )}

          {/* accepted friends live */}
          <Section title={`Your circle${accepted.length ? ` · ${accepted.length}` : ''}`}>
            {loading && accepted.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">Loading…</p>
            ) : accepted.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No friends yet — add someone by username above.</p>
            ) : (
              <div className="space-y-3">
                {accepted.map((f) => (
                  <FriendRow key={f.friendshipId} f={f} onRemove={() => remove(f.friendshipId)} />
                ))}
              </div>
            )}
          </Section>

          {/* outgoing pending */}
          {outgoing.length > 0 && (
            <Section title="Pending">
              {outgoing.map((f) => (
                <div key={f.friendshipId} className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
                  <Avatar f={f} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{f.profile.displayName}</p>
                    <p className="text-xs text-muted">@{f.profile.username}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-500">
                    <Clock size={12} /> Pending
                  </span>
                </div>
              ))}
            </Section>
          )}
        </>
      )}
    </div>
  )
}

function FriendRow({ f, onRemove }: { f: Friend; onRemove: () => void }) {
  const c = COLORS[f.profile.avatarColor]
  const rate = f.progress && f.progress.total ? f.progress.done / f.progress.total : 0
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 shadow-soft"
    >
      <Avatar f={f} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="truncate font-bold">{f.profile.displayName}</p>
          <span className="text-xs font-semibold text-muted">
            {f.progress ? `${f.progress.done}/${f.progress.total}` : '—'}
          </span>
        </div>
        <p className="truncate text-xs text-muted">
          {f.progress?.lastTitle ? `✅ ${f.progress.lastTitle}` : f.progress?.total ? 'Working on today…' : 'No tasks yet today'}
        </p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: pct(rate) }}
            style={{ background: `linear-gradient(90deg, rgb(${c.from}), rgb(${c.to}))` }}
          />
        </div>
      </div>
      <button
        onClick={onRemove}
        className="ml-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted opacity-0 transition hover:text-rose-500 group-hover:opacity-100"
        aria-label="Remove friend"
      >
        <X size={16} />
      </button>
    </motion.div>
  )
}

function Avatar({ f }: { f: Friend }) {
  const c = COLORS[f.profile.avatarColor]
  return (
    <div
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-lg font-bold text-white"
      style={{ background: `linear-gradient(135deg, rgb(${c.from}), rgb(${c.to}))` }}
    >
      {f.profile.displayName[0]?.toUpperCase()}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

function PreviewGate() {
  const PREVIEW = [
    { name: 'Aarav', color: 'blue' as const, done: 6, total: 8, live: 'just finished “Gym 💪”' },
    { name: 'Diya', color: 'rose' as const, done: 9, total: 9, live: 'completed the whole day 🎉' },
    { name: 'Kabir', color: 'emerald' as const, done: 3, total: 7, live: 'working on “Deep work”' },
  ]
  return (
    <>
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
        <Lock size={18} className="mt-0.5 shrink-0 text-amber-500" />
        <div className="text-sm">
          <p className="font-semibold text-amber-500">Preview mode</p>
          <p className="text-muted">
            Add your Supabase keys (see README) to enable real accounts, friends and live sharing. Here's how it looks:
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {PREVIEW.map((f, i) => {
          const c = COLORS[f.color]
          const rate = f.done / f.total
          return (
            <motion.div
              key={f.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 shadow-soft"
            >
              <div
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full font-bold text-white"
                style={{ background: `linear-gradient(135deg, rgb(${c.from}), rgb(${c.to}))` }}
              >
                {f.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-bold">{f.name}</p>
                  <span className="text-xs font-semibold text-muted">{pct(rate)}</span>
                </div>
                <p className="truncate text-xs text-muted">{f.live}</p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full" style={{ width: pct(rate), background: `linear-gradient(90deg, rgb(${c.from}), rgb(${c.to}))` }} />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </>
  )
}
