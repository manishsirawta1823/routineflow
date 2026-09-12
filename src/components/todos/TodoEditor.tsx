import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { COLORS, COLOR_KEYS } from '@/lib/colors'
import type { Todo, TodoColor } from '@/lib/types'
import { cn, haptic } from '@/lib/utils'
import { useStore } from '@/store/useStore'

interface Props {
  open: boolean
  onClose: () => void
  date: string
  /** when set, editing an existing todo */
  editing?: Todo | null
}

export function TodoEditor({ open, onClose, date, editing }: Props) {
  const categories = useStore((s) => s.categories)
  const addTodo = useStore((s) => s.addTodo)
  const updateTodo = useStore((s) => s.updateTodo)

  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [color, setColor] = useState<TodoColor>('violet')
  const [categoryId, setCategoryId] = useState<string | undefined>()
  const [time, setTime] = useState('')

  useEffect(() => {
    if (open) {
      setTitle(editing?.title ?? '')
      setNote(editing?.note ?? '')
      setColor(editing?.color ?? 'violet')
      setCategoryId(editing?.categoryId)
      setTime(editing?.time ?? '')
    }
  }, [open, editing])

  const save = () => {
    if (!title.trim()) return
    haptic()
    if (editing) {
      updateTodo(editing.id, { title, note, color, categoryId, time: time || undefined })
    } else {
      addTodo({ date, title, note, color, categoryId, time: time || undefined })
    }
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Edit task' : 'New task'}>
      <div className="space-y-4">
        <div>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder="What do you want to do?"
            className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-base font-semibold outline-none transition placeholder:text-muted/70 focus:border-brand"
          />
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          className="w-full resize-none rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-brand"
        />

        {/* colors */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Color</p>
          <div className="flex flex-wrap gap-2.5">
            {COLOR_KEYS.map((k) => {
              const c = COLORS[k]
              return (
                <button
                  key={k}
                  onClick={() => {
                    setColor(k)
                    haptic(6)
                  }}
                  aria-label={c.label}
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

        {/* category */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Category</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryId(categoryId === cat.id ? undefined : cat.id)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm font-medium transition',
                  categoryId === cat.id
                    ? 'border-brand bg-brand/15 text-content'
                    : 'border-border bg-surface-2 text-muted hover:text-content',
                )}
              >
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* time */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Time (for reminder)</p>
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
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand to-brand py-3.5 font-bold text-white shadow-glow transition active:scale-[0.98] disabled:opacity-40"
          style={{ backgroundImage: `linear-gradient(135deg, rgb(${COLORS[color].from}), rgb(${COLORS[color].to}))` }}
        >
          <Sparkles size={18} />
          {editing ? 'Save changes' : 'Add task'}
        </button>
      </div>
    </Sheet>
  )
}
