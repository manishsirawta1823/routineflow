import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Settings, Clock, CheckCircle2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { dayKey } from '@/lib/dates'
import { COLORS } from '@/lib/colors'
import { Sheet } from '@/components/ui/Sheet'
import { haptic } from '@/lib/utils'

export function TopControls() {
  const navigate = useNavigate()
  const todosForDate = useStore((s) => s.todosForDate)
  const profile = useStore((s) => s.profile)
  const [open, setOpen] = useState(false)

  const today = todosForDate(dayKey())
  const pending = today.filter((t) => !t.completed)

  return (
    <>
      <div className="mb-1 flex justify-end gap-2.5">
        <button
          onClick={() => {
            haptic()
            setOpen(true)
          }}
          aria-label="Notifications"
          className="relative grid h-11 w-11 place-items-center rounded-full border border-border/60 bg-surface text-content shadow-soft"
        >
          <Bell size={19} />
          {pending.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white ring-2 ring-bg">
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            haptic()
            navigate('/settings')
          }}
          aria-label="Profile & settings"
          className="grid h-11 w-11 place-items-center overflow-hidden rounded-full border border-border/60 bg-surface text-content shadow-soft"
        >
          {profile ? (
            <span
              className="grid h-full w-full place-items-center text-sm font-extrabold text-white"
              style={{ background: `linear-gradient(135deg, rgb(${COLORS[profile.avatarColor].from}), rgb(${COLORS[profile.avatarColor].to}))` }}
            >
              {profile.displayName[0]?.toUpperCase()}
            </span>
          ) : (
            <Settings size={19} />
          )}
        </button>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title="Today's reminders">
        {pending.length === 0 ? (
          <div className="grid place-items-center gap-2 py-8 text-center">
            <CheckCircle2 size={34} className="text-emerald-400" />
            <p className="font-hand text-xl text-content">All caught up! 🎉</p>
            <p className="text-sm text-muted">No pending tasks for today.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((t) => {
              const c = COLORS[t.color]
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-2xl border p-3"
                  style={{ background: `rgb(${c.from} / 0.16)`, borderColor: `rgb(${c.ring} / 0.4)` }}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: `rgb(${c.to})` }} />
                  <span className="flex-1 truncate text-sm font-semibold">{t.title}</span>
                  {t.time && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted">
                      <Clock size={12} /> {t.time}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Sheet>
    </>
  )
}
