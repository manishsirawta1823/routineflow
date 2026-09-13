import { forwardRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Clock, Trash2 } from 'lucide-react'
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
  const remove = useStore((s) => s.deleteTodo)
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
        'group relative flex items-center gap-3 rounded-2xl border p-3 pl-3.5 transition',
        todo.completed ? 'opacity-75' : '',
      )}
      style={{
        background: `rgb(${c.from} / ${todo.completed ? 0.12 : 0.22})`,
        borderColor: `rgb(${c.ring} / 0.5)`,
      }}
      onClick={() => !readOnly && onEdit?.(todo)}
    >
      {/* colored dot checkbox */}
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
        className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition-colors"
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
          <Check size={16} strokeWidth={3.6} />
        </motion.span>
        {/* satisfying burst when completed */}
        <AnimatePresence>
          {todo.completed && (
            <motion.span
              key="burst"
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{ boxShadow: `0 0 0 2px rgb(${c.ring})` }}
              initial={{ scale: 0.6, opacity: 0.7 }}
              animate={{ scale: 2.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>
      </motion.button>

      {/* body */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-[15px] font-semibold leading-tight',
            todo.completed && 'text-muted line-through',
          )}
        >
          {todo.title}
        </p>
        {(cat || todo.time) && (
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
            {cat && (
              <span className="inline-flex items-center gap-1">
                <span>{cat.emoji}</span>
                {cat.name}
              </span>
            )}
            {todo.time && (
              <span className="inline-flex items-center gap-1">
                <Clock size={12} />
                {todo.time}
              </span>
            )}
          </div>
        )}
      </div>

      {!readOnly && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            haptic(8)
            remove(todo.id)
          }}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted opacity-0 transition hover:bg-rose-500/15 hover:text-rose-500 group-hover:opacity-100"
          aria-label="Delete"
        >
          <Trash2 size={16} />
        </button>
      )}
    </motion.div>
  )
})
