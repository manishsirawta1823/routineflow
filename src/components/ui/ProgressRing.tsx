import { motion } from 'framer-motion'

interface Props {
  /** 0..1 */
  value: number
  size?: number
  stroke?: number
  from?: string // rgb triple
  to?: string // rgb triple
  children?: React.ReactNode
  trackClassName?: string
}

export function ProgressRing({
  value,
  size = 120,
  stroke = 11,
  from = '139 92 246',
  to = '34 211 238',
  children,
  trackClassName = 'text-border',
}: Props) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(1, value))
  const gid = `pr-${from.replace(/\s/g, '')}-${to.replace(/\s/g, '')}`

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={`rgb(${from})`} />
            <stop offset="100%" stopColor={`rgb(${to})`} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className={trackClassName}
          stroke="currentColor"
          opacity={0.35}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={`url(#${gid})`}
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - clamped * c }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}
