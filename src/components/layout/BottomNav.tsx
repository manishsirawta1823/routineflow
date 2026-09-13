import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, Home, BarChart3, Users, Plus } from 'lucide-react'
import { cn, haptic } from '@/lib/utils'
import { useUI } from '@/store/useUI'

const left = [
  { to: '/', label: 'Today', icon: Home },
  { to: '/history', label: 'History', icon: CalendarDays },
]
const right = [
  { to: '/reports', label: 'Report', icon: BarChart3 },
  { to: '/friends', label: 'Friends', icon: Users },
]

export function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const requestAdd = useUI((s) => s.requestAdd)

  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to))

  const onAdd = () => {
    haptic(16)
    requestAdd()
    if (pathname !== '/') navigate('/')
  }

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(env(safe-area-inset-bottom),0.6rem)]">
      <div className="glass pointer-events-auto flex w-full max-w-md items-center justify-between rounded-full border border-border/60 px-2 py-1.5 shadow-nav ring-1 ring-white/40 dark:ring-white/5">
        {left.map((item) => (
          <Tab key={item.to} {...item} active={isActive(item.to)} />
        ))}

        {/* raised center Add button */}
        <div className="relative -mt-8 px-1">
          <motion.button
            onClick={onAdd}
            whileTap={{ scale: 0.9 }}
            aria-label="Add task"
            className="grid h-14 w-14 place-items-center rounded-full text-white shadow-glow ring-4 ring-bg"
            style={{ backgroundImage: 'linear-gradient(135deg, rgb(196 181 253), rgb(244 114 182))' }}
          >
            <Plus size={26} strokeWidth={3} />
          </motion.button>
        </div>

        {right.map((item) => (
          <Tab key={item.to} {...item} active={isActive(item.to)} />
        ))}
      </div>
    </nav>
  )
}

function Tab({ to, label, icon: Icon, active }: { to: string; label: string; icon: typeof Home; active: boolean }) {
  return (
    <NavLink
      to={to}
      onClick={() => haptic()}
      className="relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-bold"
    >
      {active && (
        <motion.span
          layoutId="nav-pill"
          className="absolute inset-0 rounded-2xl bg-brand/15"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <motion.span
        animate={{ y: active ? -1 : 0, scale: active ? 1.08 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        className="relative z-10"
      >
        <Icon size={21} className={cn('transition-colors', active ? 'text-brand' : 'text-muted')} strokeWidth={active ? 2.6 : 2} />
      </motion.span>
      <span className={cn('relative z-10 transition-colors', active ? 'text-brand' : 'text-muted/90')}>{label}</span>
    </NavLink>
  )
}
