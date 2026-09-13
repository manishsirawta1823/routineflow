import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FaArrowLeft as ArrowLeft,
  FaWandMagicSparkles as Sparkles,
  FaClock as Clock,
  FaCheck as Check,
  FaTrashCan as Trash2,
} from 'react-icons/fa6'
import { COLORS, COLOR_KEYS } from '@/lib/colors'
import type { Todo, TodoColor } from '@/lib/types'
import { cn, haptic } from '@/lib/utils'
import { useStore } from '@/store/useStore'

interface Props {
  open: boolean
  onClose: () => void
  date: string
  editing?: Todo | null
}

export function TodoEditor({ open, onClose, date, editing }: Props) {
  const categories = useStore((s) => s.categories)
  const addTodo = useStore((s) => s.addTodo)
  const updateTodo = useStore((s) => s.updateTodo)
  const deleteTodo = useStore((s) => s.deleteTodo)

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
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open, editing])

  const save = () => {
    if (!title.trim()) return
    haptic()
    if (editing) updateTodo(editing.id, { title, note, color, categoryId, time: time || undefined })
    else addTodo({ date, title, note, color, categoryId, time: time || undefined })
    onClose()
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex flex-col"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          style={{
            background:
              'radial-gradient(120% 55% at 100% -5%, rgb(196 181 253 / 0.5), transparent 60%), radial-gradient(120% 45% at 0% 0%, rgb(249 168 212 / 0.4), transparent 55%), rgb(var(--bg))',
          }}
        >
          {/* header */}
          <div className="mx-auto flex w-full max-w-md items-center gap-3 px-5 pt-[max(env(safe-area-inset-top),1.1rem)]">
            <button
              onClick={onClose}
              className="grid h-11 w-11 place-items-center rounded-full bg-surface/80 text-content shadow-soft ring-1 ring-white/50 backdrop-blur dark:ring-white/10"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="flex-1 font-display text-2xl font-bold text-content">{editing ? 'Edit task' : 'New task'}</h1>
            {editing && (
              <button
                onClick={() => {
                  haptic(10)
                  deleteTodo(editing.id)
                  onClose()
                }}
                className="grid h-11 w-11 place-items-center rounded-full bg-surface/80 text-rose-500 shadow-soft ring-1 ring-white/50 backdrop-blur dark:ring-white/10"
                aria-label="Delete task"
              >
                <Trash2 size={19} />
              </button>
            )}
          </div>

          {/* scroll body */}
          <div className="no-scrollbar mx-auto w-full max-w-md flex-1 overflow-y-auto px-5 pb-32 pt-6">
            <div className="space-y-5">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && save()}
                placeholder="What do you want to do?"
                className="w-full rounded-3xl border border-border/70 bg-surface px-5 py-4 text-lg font-bold text-content shadow-soft outline-none transition placeholder:font-semibold placeholder:text-muted/60 focus:border-brand focus:ring-2 focus:ring-brand/20"
              />

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note (optional)"
                rows={3}
                className="w-full resize-none rounded-3xl border border-border/70 bg-surface px-5 py-4 text-sm font-medium text-content shadow-soft outline-none transition placeholder:text-muted/60 focus:border-brand focus:ring-2 focus:ring-brand/20"
              />

              <Section label="Pick a color">
                <div className="flex flex-wrap gap-3">
                  {COLOR_KEYS.map((k) => {
                    const c = COLORS[k]
                    const active = color === k
                    return (
                      <button
                        key={k}
                        onClick={() => {
                          setColor(k)
                          haptic(6)
                        }}
                        aria-label={c.label}
                        className={cn(
                          'grid h-11 w-11 place-items-center rounded-full ring-2 ring-offset-2 ring-offset-bg transition-all',
                          active ? 'scale-110 ring-content/60' : 'ring-transparent',
                        )}
                        style={{ background: `linear-gradient(135deg, rgb(${c.from}), rgb(${c.to}))` }}
                      >
                        <AnimatePresence>
                          {active && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="text-white"
                            >
                              <Check size={18} strokeWidth={3.5} />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    )
                  })}
                </div>
              </Section>

              <Section label="Category">
                <div className="flex flex-wrap gap-2.5">
                  {categories.map((cat) => {
                    const active = categoryId === cat.id
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setCategoryId(active ? undefined : cat.id)
                          haptic(6)
                        }}
                        className={cn(
                          'rounded-full border px-4 py-2.5 text-sm font-bold shadow-soft transition',
                          active ? 'border-brand bg-brand/15 text-content' : 'border-border/70 bg-surface text-muted',
                        )}
                      >
                        {cat.emoji} {cat.name}
                      </button>
                    )
                  })}
                </div>
              </Section>

              <Section label="Reminder time">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface px-4 py-3 shadow-soft focus-within:border-brand">
                  <Clock size={17} className="text-muted" />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="bg-transparent text-sm font-bold text-content outline-none"
                  />
                </div>
              </Section>
            </div>
          </div>

          {/* sticky action */}
          <div className="mx-auto w-full max-w-md px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-2">
            <motion.button
              onClick={save}
              disabled={!title.trim()}
              whileTap={{ scale: 0.97 }}
              className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-base font-extrabold text-white shadow-glow ring-1 ring-white/30 transition disabled:opacity-40"
              style={{ backgroundImage: `linear-gradient(135deg, rgb(${COLORS[color].from}), rgb(${COLORS[color].to}))` }}
            >
              <Sparkles size={20} />
              {editing ? 'Save changes' : 'Add task'}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 px-1 text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
      {children}
    </div>
  )
}
