import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Sparkles, Target, StickyNote, PenLine } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { dayKey, isTodayKey, longDay, fromKey, weekRange, format } from '@/lib/dates'
import { TodoCard } from '@/components/todos/TodoCard'
import { TodoEditor } from '@/components/todos/TodoEditor'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { currentStreak } from '@/lib/stats'
import { pct, haptic, cn } from '@/lib/utils'
import type { Todo } from '@/lib/types'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Late night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

const WD = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function Today() {
  const [date, setDate] = useState(dayKey())
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Todo | null>(null)

  const todosForDate = useStore((s) => s.todosForDate)
  const allTodos = useStore((s) => s.todos)
  const materialize = useStore((s) => s.materializeRoutines)
  const profile = useStore((s) => s.profile)
  const dayMeta = useStore((s) => s.dayMeta[date])
  const setDayMeta = useStore((s) => s.setDayMeta)

  useEffect(() => {
    materialize(date)
  }, [date, materialize])

  const todos = todosForDate(date)
  const completed = todos.filter((t) => t.completed).length
  const rate = todos.length ? completed / todos.length : 0
  const streak = useMemo(() => currentStreak(allTodos), [allTodos])

  // Sun–Sat week around the viewed date (matches the planner reference strip)
  const week = useMemo(() => weekRange(fromKey(date), 0), [date])

  const openNew = () => {
    setEditing(null)
    setEditorOpen(true)
    haptic()
  }
  const openEdit = (t: Todo) => {
    setEditing(t)
    setEditorOpen(true)
  }

  return (
    <div className="pb-nav mx-auto max-w-md px-4 pt-[max(env(safe-area-inset-top),1.25rem)]">
      {/* header */}
      <header className="mb-3 text-center">
        <p className="font-hand text-lg text-muted">
          {greeting()}{profile ? `, ${profile.displayName.split(' ')[0]}` : ''} ✿
        </p>
        <h1 className="font-script text-3xl text-content">Daily Planner</h1>
        <div className="mt-1 flex items-center justify-center gap-2 text-sm text-muted">
          <PenLine size={13} />
          <span className="font-hand text-base">{longDay(date)}</span>
        </div>
      </header>

      {/* week strip */}
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-surface px-2 py-2 shadow-soft">
        {week.keys.map((k, i) => {
          const selected = k === date
          const today = isTodayKey(k)
          return (
            <button
              key={k}
              onClick={() => {
                setDate(k)
                haptic(6)
              }}
              className="flex flex-1 flex-col items-center gap-1 py-1"
            >
              <span className={cn('text-[11px] font-bold', selected ? 'text-brand' : 'text-muted')}>{WD[i]}</span>
              <span
                className={cn(
                  'grid h-8 w-8 place-items-center rounded-full text-sm font-bold transition',
                  selected ? 'text-white shadow-glow' : today ? 'text-brand' : 'text-content',
                )}
                style={selected ? { background: 'linear-gradient(135deg, rgb(196 181 253), rgb(249 168 212))' } : undefined}
              >
                {format(fromKey(k), 'd')}
              </span>
            </button>
          )
        })}
      </div>

      {/* progress hero */}
      <div className="relative mb-5 overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-soft">
        <div className="flex items-center gap-5">
          <ProgressRing value={rate} size={100} from="196 181 253" to="249 168 212">
            <div className="text-center">
              <div className="font-script text-xl leading-none text-content">{pct(rate)}</div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted">done</div>
            </div>
          </ProgressRing>
          <div className="flex-1">
            <p className="font-hand text-2xl leading-tight text-content">
              {todos.length === 0
                ? 'A fresh day ✨'
                : completed === todos.length
                  ? 'All done! 🎉'
                  : `${completed} of ${todos.length} done`}
            </p>
            <p className="mt-0.5 text-sm text-muted">
              {todos.length === 0
                ? 'Plan your routine below.'
                : completed === todos.length
                  ? 'You showed up today. Keep it going!'
                  : `${todos.length - completed} to go — small steps, big results.`}
            </p>
            {streak > 0 && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-orange-400/15 px-2.5 py-1 text-xs font-bold text-orange-500">
                🔥 {streak} day streak
              </div>
            )}
          </div>
        </div>
      </div>

      {/* To Do List */}
      <SectionLabel icon={<Sparkles size={15} />} text="To Do List" />
      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {todos.map((t) => (
            <TodoCard key={t.id} todo={t} onEdit={openEdit} />
          ))}
        </AnimatePresence>

        {todos.length === 0 && (
          <motion.button
            onClick={openNew}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid w-full place-items-center gap-2 rounded-2xl border-2 border-dashed border-border py-10 text-center text-muted transition hover:border-brand hover:text-brand"
          >
            <Plus size={22} />
            <span className="font-hand text-lg">Tap to add your first task</span>
          </motion.button>
        )}
      </div>

      {/* Goal for today */}
      <div className="mt-5">
        <PlannerNote
          icon={<Target size={15} />}
          label="Goal for today"
          tint="249 168 212"
          placeholder="small changes equal big results"
          value={dayMeta?.goal ?? ''}
          onChange={(v) => setDayMeta(date, { goal: v })}
        />
      </div>

      {/* Notes */}
      <div className="mt-4">
        <PlannerNote
          icon={<StickyNote size={15} />}
          label="Notes"
          tint="253 186 116"
          placeholder="drink plenty of water…"
          value={dayMeta?.notes ?? ''}
          onChange={(v) => setDayMeta(date, { notes: v })}
        />
      </div>

      {/* FAB — pinned to the right edge of the centered column, above the nav */}
      <div className="bottom-nav-gap pointer-events-none fixed inset-x-0 z-30 mx-auto max-w-md px-4">
        <div className="flex justify-end">
          <motion.button
            onClick={openNew}
            whileTap={{ scale: 0.94 }}
            className="pointer-events-auto flex items-center gap-2 rounded-full px-5 py-3.5 font-extrabold text-white shadow-glow ring-1 ring-white/30"
            style={{ backgroundImage: 'linear-gradient(135deg, rgb(196 181 253), rgb(244 114 182))' }}
          >
            <Plus size={20} strokeWidth={3} />
            <span className="text-sm">Add task</span>
          </motion.button>
        </div>
      </div>

      <TodoEditor open={editorOpen} onClose={() => setEditorOpen(false)} date={date} editing={editing} />
    </div>
  )
}

function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="mb-2.5 flex items-center gap-2 px-1">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-brand/15 text-brand">{icon}</span>
      <h2 className="font-script text-xl text-content">{text}</h2>
    </div>
  )
}

function PlannerNote({
  icon,
  label,
  tint,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  tint: string
  placeholder: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div
      className="rounded-3xl border p-4 shadow-soft"
      style={{ background: `rgb(${tint} / 0.16)`, borderColor: `rgb(${tint} / 0.4)` }}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full text-white" style={{ background: `rgb(${tint})` }}>
          {icon}
        </span>
        <h3 className="font-script text-lg text-content">{label}</h3>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full resize-none bg-transparent font-hand text-xl leading-snug text-content outline-none placeholder:text-muted/60"
      />
    </div>
  )
}
