import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Moon,
  Sun,
  Monitor,
  Bell,
  BellRing,
  Repeat,
  Plus,
  Cloud,
  CloudOff,
  Trash2,
  Pencil,
  LogIn,
  LogOut,
  Heart,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { isCloudEnabled, supabase } from '@/lib/supabase'
import { useAuth } from '@/store/useAuth'
import { useUI } from '@/store/useUI'
import { RoutineEditor } from '@/components/routines/RoutineEditor'
import { TopControls } from '@/components/layout/TopControls'
import { COLORS } from '@/lib/colors'
import { cn, haptic } from '@/lib/utils'
import type { Routine } from '@/lib/types'
import {
  isPushSupported,
  isPushConfigured,
  isPushSubscribed,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/cloud/push'

export function Settings() {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const routines = useStore((s) => s.routines)
  const deleteRoutine = useStore((s) => s.deleteRoutine)
  const profile = useStore((s) => s.profile)
  const setProfile = useStore((s) => s.setProfile)
  const resetAll = useStore((s) => s.resetAll)

  const authStatus = useAuth((s) => s.status)
  const authUser = useAuth((s) => s.user)
  const signOut = useAuth((s) => s.signOut)
  const setAuthOpen = useUI((s) => s.setAuthOpen)
  const signedIn = authStatus === 'signedIn'

  const [routineOpen, setRoutineOpen] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null)
  const [name, setName] = useState(profile?.displayName ?? '')
  const [pushOn, setPushOn] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)

  // keep the name field in sync once a cloud profile loads
  useEffect(() => {
    if (profile?.displayName) setName(profile.displayName)
  }, [profile?.displayName])

  useEffect(() => {
    if (signedIn) isPushSubscribed().then(setPushOn)
  }, [signedIn])

  const themes = [
    { key: 'light', label: 'Light', icon: Sun },
    { key: 'dark', label: 'Dark', icon: Moon },
    { key: 'system', label: 'Auto', icon: Monitor },
  ] as const

  const enableReminders = async (on: boolean) => {
    if (on && 'Notification' in window) {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') return
    }
    updateSettings({ remindersEnabled: on })
    haptic()
  }

  const togglePush = async (on: boolean) => {
    if (!authUser) return
    setPushBusy(true)
    haptic()
    if (on) {
      const res = await subscribeToPush(authUser.id)
      setPushOn(res.ok)
      if (!res.ok && res.reason) alert(res.reason)
    } else {
      await unsubscribeFromPush(authUser.id)
      setPushOn(false)
    }
    setPushBusy(false)
  }

  const saveProfile = () => {
    if (!name.trim()) return
    setProfile({
      id: profile?.id ?? 'me',
      username: profile?.username ?? name.trim().toLowerCase().replace(/\s+/g, '_'),
      displayName: name.trim(),
      avatarColor: profile?.avatarColor ?? 'violet',
      createdAt: profile?.createdAt ?? new Date().toISOString(),
    })
    // mirror to cloud profile when signed in
    if (signedIn && authUser && supabase) {
      supabase.from('profiles').update({ display_name: name.trim() }).eq('id', authUser.id)
    }
    haptic()
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-nav pt-[max(env(safe-area-inset-top),0.85rem)]">
      <TopControls />
      <header className="mb-5">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">You</h1>
        <p className="text-sm text-muted">Profile, appearance & routines.</p>
      </header>

      {/* profile */}
      <Section title="Profile">
        <div className="flex items-center gap-3">
          <div
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl font-display text-2xl font-extrabold text-white"
            style={{ background: `linear-gradient(135deg, rgb(${COLORS[profile?.avatarColor ?? 'violet'].from}), rgb(${COLORS[profile?.avatarColor ?? 'violet'].to}))` }}
          >
            {(name || 'Y')[0].toUpperCase()}
          </div>
          <div className="flex flex-1 gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="min-w-0 flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
            <button
              onClick={saveProfile}
              className="rounded-xl bg-brand px-4 text-sm font-semibold text-white transition active:scale-95"
            >
              Save
            </button>
          </div>
        </div>
      </Section>

      {/* appearance */}
      <Section title="Appearance">
        <div className="flex rounded-2xl border border-border/70 bg-surface-2 p-1">
          {themes.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                updateSettings({ theme: key })
                haptic(6)
              }}
              className={cn(
                'relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition',
                settings.theme === key ? 'text-white' : 'text-muted',
              )}
            >
              {settings.theme === key && (
                <motion.span layoutId="theme-pill" className="absolute inset-0 rounded-xl bg-brand" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
              )}
              <Icon size={16} className="relative z-10" />
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* reminders */}
      <Section title="Reminders">
        <Row
          icon={<Bell size={18} className="text-amber-500" />}
          title="Task reminders"
          subtitle={settings.remindersEnabled ? "On — you'll be nudged before scheduled tasks" : 'Get notified before timed tasks'}
        >
          <Toggle on={settings.remindersEnabled} onChange={enableReminders} />
        </Row>

        {signedIn && isPushSupported() && (
          <div className="mt-3 border-t border-border/60 pt-3">
            <Row
              icon={<BellRing size={18} className="text-brand" />}
              title="Push notifications"
              subtitle={
                !isPushConfigured()
                  ? 'Add a VAPID key (see README) to enable phone push'
                  : pushOn
                    ? 'On — reminders reach your phone even when the app is closed'
                    : 'Get pushes on your phone even when the app is closed'
              }
            >
              <Toggle on={pushOn} onChange={togglePush} disabled={pushBusy || !isPushConfigured()} />
            </Row>
          </div>
        )}
      </Section>

      {/* routines */}
      <Section
        title="Recurring routines"
        action={
          <button
            onClick={() => {
              setEditingRoutine(null)
              setRoutineOpen(true)
            }}
            className="flex items-center gap-1 rounded-full bg-brand/15 px-3 py-1.5 text-sm font-semibold text-brand"
          >
            <Plus size={15} /> New
          </button>
        }
      >
        {routines.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl bg-surface-2 p-3 text-sm text-muted">
            <Repeat size={18} /> No routines yet. Add tasks that repeat automatically.
          </div>
        ) : (
          <div className="space-y-2">
            {routines.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
                <span className="h-8 w-1.5 rounded-full" style={{ background: `linear-gradient(rgb(${COLORS[r.color].from}), rgb(${COLORS[r.color].to}))` }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.title}</p>
                  <p className="text-xs text-muted">
                    {r.daysOfWeek.length === 0 ? 'Every day' : `${r.daysOfWeek.length} days/week`}
                    {r.time ? ` · ${r.time}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingRoutine(r)
                    setRoutineOpen(true)
                  }}
                  className="grid h-8 w-8 place-items-center rounded-full text-muted hover:text-content"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => deleteRoutine(r.id)}
                  className="grid h-8 w-8 place-items-center rounded-full text-muted hover:text-rose-400"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* account / cloud */}
      <Section title="Account & sync">
        {!isCloudEnabled ? (
          <Row
            icon={<CloudOff size={18} className="text-muted" />}
            title="Local only"
            subtitle="Add Supabase keys in .env to enable login, sync, friends & live sharing"
          />
        ) : signedIn ? (
          <div className="space-y-3">
            <Row
              icon={<Cloud size={18} className="text-emerald-500" />}
              title="Cloud connected"
              subtitle={`Signed in as ${authUser?.email ?? profile?.username ?? 'you'} · synced live`}
            />
            <button
              onClick={() => {
                haptic()
                signOut()
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface-2 py-2.5 text-sm font-semibold text-content transition active:scale-95"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <Row
              icon={<Cloud size={18} className="text-brand" />}
              title="Sign in to sync"
              subtitle="Log in to sync across devices, add friends & share live"
            />
            <button
              onClick={() => {
                haptic()
                setAuthOpen(true)
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-bold text-white shadow-glow transition active:scale-95"
              style={{ backgroundImage: 'linear-gradient(135deg, rgb(196 181 253), rgb(249 168 212))' }}
            >
              <LogIn size={16} /> Sign in / Create account
            </button>
          </div>
        )}
      </Section>

      {/* danger */}
      <button
        onClick={() => {
          if (confirm('Reset all local data? This cannot be undone.')) resetAll()
        }}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/5 py-3 text-sm font-semibold text-rose-400 transition active:scale-95"
      >
        <Trash2 size={16} /> Reset all data
      </button>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
        Made with <Heart size={12} className="text-rose-400" /> · RoutineFlow v0.1
      </p>

      <RoutineEditor open={routineOpen} onClose={() => setRoutineOpen(false)} editing={editingRoutine} />
    </div>
  )
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted">{title}</h2>
        {action}
      </div>
      <div className="rounded-3xl border border-border/70 bg-surface p-4 shadow-soft">{children}</div>
    </section>
  )
}

function Row({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-2">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      className={cn(
        'relative h-7 w-12 rounded-full transition',
        on ? 'bg-brand' : 'bg-surface-2',
        disabled && 'opacity-50',
      )}
      role="switch"
      aria-checked={on}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 h-5 w-5 rounded-full bg-white shadow"
        style={{ left: on ? 24 : 4 }}
      />
    </button>
  )
}
