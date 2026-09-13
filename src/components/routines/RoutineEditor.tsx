import { useEffect, useState } from 'react'
import { FaRepeat as Repeat } from 'react-icons/fa6'
import { Sheet } from '@/components/ui/Sheet'
import { COLORS, COLOR_KEYS } from '@/lib/colors'
import type { Routine, TodoColor } from '@/lib/types'
import { cn, haptic } from '@/lib/utils'
import { useStore } from '@/store/useStore'

const DAYS = [
  { i: 1, l: 'M' },
  { i: 2, l: 'T' },
  { i: 3, l: 'W' },
  { i: 4, l: 'T' },
  { i: 5, l: 'F' },
  { i: 6, l: 'S' },
  { i: 0, l: 'S' },
]

interface Props {
  open: boolean
  onClose: () => void
  editing?: Routine | null
}

export function RoutineEditor({ open, onClose, editing }: Props) {
  const categories = useStore((s) => s.categories)
  const addRoutine = useStore((s) => s.addRoutine)
  const updateRoutine = useStore((s) => s.updateRoutine)

  const [title, setTitle] = useState('')
  const [color, setColor] = useState<TodoColor>('blue')
  const [categoryId, setCategoryId] = useState<string | undefined>()
  const [time, setTime] = useState('')
  const [days, setDays] = useState<number[]>([])

  useEffect(() => {
    if (open) {
      setTitle(editing?.title ?? '')
      setColor(editing?.color ?? 'blue')
      setCategoryId(editing?.categoryId)
      setTime(editing?.time ?? '')
      setDays(editing?.daysOfWeek ?? [])
    }
  }, [open, editing])

  const toggleDay = (i: number) =>
    setDays((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]))

  const save = () => {
    if (!title.trim()) return
    haptic()
    const payload = { title, color, categoryId, time: time || undefined, daysOfWeek: days }
    if (editing) updateRoutine(editing.id, payload)
    else addRoutine(payload)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Edit routine' : 'New routine'}>
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Routines repeat automatically on the days you choose — they appear in your day every time.
        </p>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Morning workout"
          className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-base font-semibold outline-none focus:border-brand"
        />

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Repeat on</p>
          <div className="flex gap-2">
            {DAYS.map((d) => (
              <button
                key={`${d.i}-${d.l}`}
                onClick={() => toggleDay(d.i)}
                className={cn(
                  'h-11 flex-1 rounded-2xl text-sm font-bold transition',
                  days.includes(d.i) ? 'bg-brand text-white' : 'bg-surface-2 text-muted',
                )}
              >
                {d.l}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted">{days.length === 0 ? 'Every day' : `${days.length} day(s) selected`}</p>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Color</p>
          <div className="flex flex-wrap gap-2.5">
            {COLOR_KEYS.map((k) => {
              const c = COLORS[k]
              return (
                <button
                  key={k}
                  onClick={() => setColor(k)}
                  className={cn(
                    'h-9 w-9 rounded-full ring-2 ring-offset-2 ring-offset-surface transition',
                    color === k ? 'scale-110 ring-content/70' : 'ring-transparent',
                  )}
                  style={{ background: `linear-gradient(135deg, rgb(${c.from}), rgb(${c.to}))` }}
                />
              )
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Category</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryId(categoryId === cat.id ? undefined : cat.id)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm font-medium transition',
                  categoryId === cat.id ? 'border-brand bg-brand/15' : 'border-border bg-surface-2 text-muted',
                )}
              >
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Time</p>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="rounded-2xl border border-border bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-brand"
          />
        </div>

        <button
          onClick={save}
          disabled={!title.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white shadow-glow transition active:scale-[0.98] disabled:opacity-40"
          style={{ backgroundImage: `linear-gradient(135deg, rgb(${COLORS[color].from}), rgb(${COLORS[color].to}))` }}
        >
          <Repeat size={18} />
          {editing ? 'Save routine' : 'Create routine'}
        </button>
      </div>
    </Sheet>
  )
}
