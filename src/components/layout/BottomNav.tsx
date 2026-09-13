import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, Home, BarChart3, Users, Settings } from 'lucide-react'
import { cn, haptic } from '@/lib/utils'

const items = [
  { to: '/', label: 'Today', icon: Home },
  { to: '/history', label: 'History', icon: CalendarDays },
  { to: '/reports', label: 'Report', icon: BarChart3 },
  { to: '/friends', label: 'Friends', icon: Users },
  { to: '/settings', label: 'You', icon: Settings },
]

export function BottomNav() {
  const { pathname } = useLocation()
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(env(safe-area-inset-bottom),0.6rem)]">
      <div className="glass pointer-events-auto flex w-full max-w-md items-center justify-between gap-0.5 rounded-[1.4rem] border border-border/60 p-1.5 shadow-nav ring-1 ring-white/40 dark:ring-white/5">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
          return (
            <NavLink
              key={to}
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
                <Icon
                  size={21}
                  className={cn('transition-colors', active ? 'text-brand' : 'text-muted')}
                  strokeWidth={active ? 2.6 : 2}
                />
              </motion.span>
              <span className={cn('relative z-10 transition-colors', active ? 'text-brand' : 'text-muted/90')}>
                {label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
