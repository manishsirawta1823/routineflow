import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { dayStats } from '@/lib/stats'
import {
  dayKey,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  format,
  fromKey,
  isTodayKey,
  longDay,
} from '@/lib/dates'
import { TodoCard } from '@/components/todos/TodoCard'
import { TopControls } from '@/components/layout/TopControls'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function rateColor(rate: number, has: boolean): string {
  if (!has) return 'bg-surface-2 text-muted'
  if (rate >= 1) return 'text-white'
  if (rate >= 0.5) return 'text-white'
  return 'text-content'
}

export function History() {
  const todos = useStore((s) => s.todos)
  const todosForDate = useStore((s) => s.todosForDate)
  const [ref, setRef] = useState(new Date())
  const [selected, setSelected] = useState<string | null>(dayKey())

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(ref), end: endOfMonth(ref) }),
    [ref],
  )
  const keys = days.map((d) => dayKey(d))
  const stats = useMemo(() => dayStats(todos, keys), [todos, keys])
  const statMap = new Map(stats.map((s) => [s.date, s]))

  // leading blanks so the 1st lands on the right weekday (Mon-start)
  const firstWeekday = (fromKey(keys[0]).getDay() + 6) % 7
  const blanks = Array.from({ length: firstWeekday })

  const selectedTodos = selected ? todosForDate(selected) : []

  return (
    <div className="mx-auto max-w-md px-4 pb-nav pt-[max(env(safe-area-inset-top),0.85rem)]">
      <TopControls />
      <header className="mb-5">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">History</h1>
        <p className="text-sm text-muted">Every day you've shown up.</p>
      </header>

      {/* month nav */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setRef((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted transition hover:text-content"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-display font-bold">{format(ref, 'MMMM yyyy')}</span>
        <button
          onClick={() => setRef((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted transition hover:text-content"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* calendar */}
      <div className="rounded-3xl border border-border/70 bg-surface p-4 shadow-soft">
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted">
          {WEEKDAYS.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {blanks.map((_, i) => (
            <div key={`b-${i}`} />
          ))}
          {keys.map((k) => {
            const s = statMap.get(k)
            const has = !!s && s.total > 0
            const active = selected === k
            const rate = s?.rate ?? 0
            return (
              <button
                key={k}
                onClick={() => setSelected(k)}
                className={cn(
                  'relative aspect-square rounded-2xl text-sm font-semibold transition',
                  rateColor(rate, has),
                  active && 'ring-2 ring-brand ring-offset-2 ring-offset-surface',
                  isTodayKey(k) && !active && 'ring-1 ring-brand/50',
                )}
                style={
                  has
                    ? {
                        backgroundImage: `linear-gradient(135deg, rgb(139 92 246 / ${0.25 + rate * 0.75}), rgb(34 211 238 / ${0.2 + rate * 0.6}))`,
                      }
                    : undefined
                }
              >
                {format(fromKey(k), 'd')}
                {has && s!.completed === s!.total && (
                  <span className="absolute right-1 top-1 text-[8px]">✨</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* selected day detail */}
      <AnimatePresence mode="wait">
        {selected && (
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-6"
          >
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display font-bold">{longDay(selected)}</h2>
              <span className="text-sm text-muted">
                {selectedTodos.filter((t) => t.completed).length}/{selectedTodos.length}
              </span>
            </div>
            <div className="space-y-2.5">
              {selectedTodos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
                  No tasks recorded for this day.
                </div>
              ) : (
                selectedTodos.map((t) => <TodoCard key={t.id} todo={t} readOnly />)
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
