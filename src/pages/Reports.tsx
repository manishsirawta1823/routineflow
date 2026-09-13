import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  Bar,
  BarChart,
  Cell,
} from 'recharts'
import { Flame, TrendingUp, TrendingDown, Trophy, Target, CalendarCheck } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { TopControls } from '@/components/layout/TopControls'
import { dayStats, summarize, currentStreak, longestStreak, byCategory, grade } from '@/lib/stats'
import { weekRange, monthRange, yearRange, format, fromKey } from '@/lib/dates'
import { COLORS } from '@/lib/colors'
import { cn, pct } from '@/lib/utils'
import type { TodoColor } from '@/lib/types'

type Period = 'week' | 'month' | 'year'

export function Reports() {
  const todos = useStore((s) => s.todos)
  const categories = useStore((s) => s.categories)
  const weekStartsOn = useStore((s) => s.settings.weekStartsOn)
  const [period, setPeriod] = useState<Period>('week')

  const { range, prevRange } = useMemo(() => {
    const now = new Date()
    if (period === 'week') {
      const prev = new Date(now)
      prev.setDate(prev.getDate() - 7)
      return { range: weekRange(now, weekStartsOn), prevRange: weekRange(prev, weekStartsOn) }
    }
    if (period === 'month') {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return { range: monthRange(now), prevRange: monthRange(prev) }
    }
    const prev = new Date(now.getFullYear() - 1, 0, 1)
    return { range: yearRange(now), prevRange: yearRange(prev) }
  }, [period, weekStartsOn])

  const stats = useMemo(() => dayStats(todos, range.keys), [todos, range.keys])
  const prevStats = useMemo(() => dayStats(todos, prevRange.keys), [todos, prevRange.keys])
  const summary = summarize(stats)
  const prevSummary = summarize(prevStats)
  const g = grade(summary.rate)

  const delta = summary.rate - prevSummary.rate
  const streak = currentStreak(todos)
  const best = longestStreak(todos)
  const periodTodos = todos.filter((t) => range.keys.includes(t.date))
  const cats = byCategory(periodTodos, categories)

  // chart data
  const chartData = useMemo(() => {
    if (period === 'year') {
      // group by month
      const months = Array.from({ length: 12 }, (_, m) => ({ label: format(new Date(2000, m, 1), 'MMM'), completed: 0, total: 0 }))
      for (const s of stats) {
        const m = fromKey(s.date).getMonth()
        months[m].completed += s.completed
        months[m].total += s.total
      }
      return months.map((m) => ({ label: m.label, rate: m.total ? Math.round((m.completed / m.total) * 100) : 0 }))
    }
    return stats.map((s) => ({
      label: period === 'week' ? format(fromKey(s.date), 'EEE') : format(fromKey(s.date), 'd'),
      rate: Math.round(s.rate * 100),
    }))
  }, [stats, period])

  return (
    <div className="mx-auto max-w-md px-4 pb-nav pt-[max(env(safe-area-inset-top),0.85rem)]">
      <TopControls />
      <header className="mb-4">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Report Card</h1>
        <p className="text-sm text-muted">{range.label}</p>
      </header>

      {/* period toggle */}
      <div className="mb-5 flex rounded-2xl border border-border/70 bg-surface p-1">
        {(['week', 'month', 'year'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'relative flex-1 rounded-full py-2.5 text-sm font-semibold capitalize transition',
              period === p ? 'text-white' : 'text-muted',
            )}
          >
            {period === p && (
              <motion.span
                layoutId="period-pill"
                className="absolute inset-0 rounded-full bg-brand"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">{p}</span>
          </button>
        ))}
      </div>

      {/* grade card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative mb-4 overflow-hidden rounded-3xl border border-border/70 bg-surface p-5 shadow-soft"
      >
        <div
          className="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-20 blur-2xl"
          style={{ background: `rgb(${g.color})` }}
        />
        <div className="flex items-center gap-4">
          <div
            className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl font-display text-4xl font-extrabold text-white shadow-glow"
            style={{ background: `linear-gradient(135deg, rgb(${g.color}), rgb(${g.color} / 0.7))` }}
          >
            {g.letter}
          </div>
          <div className="flex-1">
            <p className="font-display text-xl font-extrabold">{g.label}</p>
            <p className="text-sm text-muted">
              {summary.completed} of {summary.total} tasks completed · {pct(summary.rate)}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold">
              {delta >= 0 ? (
                <TrendingUp size={13} className="text-emerald-400" />
              ) : (
                <TrendingDown size={13} className="text-rose-400" />
              )}
              <span className={delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {delta >= 0 ? '+' : ''}
                {Math.round(delta * 100)}%
              </span>
              <span className="text-muted">vs last {period}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* trend chart */}
      <div className="mb-4 rounded-3xl border border-border/70 bg-surface p-4 shadow-soft">
        <p className="mb-3 text-sm font-semibold text-muted">Completion trend</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            {period === 'year' ? (
              <BarChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'rgb(148 150 176)' }} />
                <Tooltip content={<ChartTip />} cursor={{ fill: 'rgb(139 92 246 / 0.08)' }} />
                <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill="rgb(139 92 246)" />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(139 92 246)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="rgb(139 92 246)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'rgb(148 150 176)' }} interval={period === 'month' ? 4 : 0} />
                <Tooltip content={<ChartTip />} cursor={{ stroke: 'rgb(139 92 246 / 0.3)' }} />
                <Area type="monotone" dataKey="rate" stroke="rgb(139 92 246)" strokeWidth={2.5} fill="url(#grad)" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* stat tiles */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <StatTile icon={<Flame size={18} />} label="Current streak" value={`${streak} days`} tint="251 146 60" />
        <StatTile icon={<Trophy size={18} />} label="Best streak" value={`${best} days`} tint="251 191 36" />
        <StatTile icon={<CalendarCheck size={18} />} label="Active days" value={`${summary.activeDays}`} tint="59 130 246" />
        <StatTile icon={<Target size={18} />} label="Perfect days" value={`${summary.perfectDays}`} tint="52 211 153" />
      </div>

      {/* category breakdown */}
      {cats.length > 0 && (
        <div className="rounded-3xl border border-border/70 bg-surface p-4 shadow-soft">
          <p className="mb-3 text-sm font-semibold text-muted">By category</p>
          <div className="space-y-3">
            {cats.map((c) => {
              const col = COLORS[(c.category.color as TodoColor) ?? 'violet']
              return (
                <div key={c.category.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {c.category.emoji} {c.category.name}
                    </span>
                    <span className="text-muted">
                      {c.completed}/{c.total} · {pct(c.rate)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: pct(c.rate) }}
                      transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                      style={{ background: `linear-gradient(90deg, rgb(${col.from}), rgb(${col.to}))` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function StatTile({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: string; tint: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-surface p-4 shadow-soft">
      <div
        className="mb-2 grid h-10 w-10 place-items-center rounded-2xl"
        style={{ background: `rgb(${tint} / 0.15)`, color: `rgb(${tint})` }}
      >
        {icon}
      </div>
      <div className="font-display text-xl font-extrabold">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  )
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-2xl border border-border bg-surface px-3 py-1.5 text-xs shadow-soft">
      <div className="font-semibold">{label}</div>
      <div className="text-brand">{payload[0].value}% done</div>
    </div>
  )
}
