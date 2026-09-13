import { forwardRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Clock } from 'lucide-react'
import type { Todo } from '@/lib/types'
import { COLORS } from '@/lib/colors'
import { cn, haptic } from '@/lib/utils'
import { useStore } from '@/store/useStore'

interface Props {
  todo: Todo
  readOnly?: boolean
  onEdit?: (todo: Todo) => void
}

export const TodoCard = forwardRef<HTMLDivElement, Props>(function TodoCard(
  { todo, readOnly, onEdit },
  ref,
) {
  const toggle = useStore((s) => s.toggleTodo)
  const categories = useStore((s) => s.categories)
  const c = COLORS[todo.color]
  const cat = categories.find((x) => x.id === todo.categoryId)

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -30, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className={cn(
        'group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border/70 bg-surface p-2.5 pl-3 shadow-soft transition',
        todo.completed && 'opacity-70',
      )}
      onClick={() => !readOnly && onEdit?.(todo)}
    >
      {/* colored accent rail */}
      <span
        className="absolute inset-y-2 left-0 w-1 rounded-full"
        style={{ background: `linear-gradient(rgb(${c.from}), rgb(${c.to}))` }}
      />

      {/* colored checkbox */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation()
          if (readOnly) return
          haptic(todo.completed ? 8 : 20)
          toggle(todo.id)
        }}
        disabled={readOnly}
        whileTap={{ scale: 0.8 }}
        aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
        className="relative ml-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-colors"
        style={{
          borderColor: `rgb(${c.ring})`,
          background: todo.completed ? `linear-gradient(135deg, rgb(${c.from}), rgb(${c.to}))` : 'transparent',
        }}
      >
        <motion.span
          initial={false}
          animate={{ scale: todo.completed ? 1 : 0.2, opacity: todo.completed ? 1 : 0 }}
          transition={{ type: 'spring', stiffness: 520, damping: 20 }}
          className="text-white"
        >
          <Check size={15} strokeWidth={3.6} />
        </motion.span>
        <AnimatePresence>
          {todo.completed && (
            <motion.span
              key="burst"
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{ boxShadow: `0 0 0 2px rgb(${c.ring})` }}
              initial={{ scale: 0.6, opacity: 0.7 }}
              animate={{ scale: 2.4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>
      </motion.button>

      {/* body */}
      <div className="min-w-0 flex-1 py-1">
        <p
          className={cn(
            'truncate text-[15px] font-bold leading-tight',
            todo.completed && 'text-muted line-through',
          )}
        >
          {todo.title}
        </p>
        <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-muted">
          {cat && <span>{cat.name}</span>}
          {cat && todo.time && <span className="text-muted/40">•</span>}
          {todo.time && (
            <span className="inline-flex items-center gap-1">
              <Clock size={11} strokeWidth={2.5} />
              {todo.time}
            </span>
          )}
          {!cat && !todo.time && <span className="text-muted/60">Tap to edit</span>}
        </div>
      </div>

      {/* right: category emoji in a soft colored tile */}
      <div
        className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl"
        style={{ background: `rgb(${c.from} / 0.18)` }}
      >
        {cat ? cat.emoji : '📝'}
      </div>
    </motion.div>
  )
})
