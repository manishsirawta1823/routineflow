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
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
      <div className="glass pointer-events-auto flex w-full max-w-md items-center justify-between gap-1 rounded-2xl border border-border/70 p-1.5 shadow-soft">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              onClick={() => haptic()}
              className="relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-semibold"
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl bg-brand/15"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon
                size={20}
                className={cn('relative z-10 transition', active ? 'text-brand' : 'text-muted')}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={cn('relative z-10 transition', active ? 'text-brand' : 'text-muted')}>
                {label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
