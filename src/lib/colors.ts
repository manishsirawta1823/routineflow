import type { TodoColor } from './types'

interface ColorDef {
  key: TodoColor
  label: string
  /** tailwind-ish rgb triples used inline for gradients/rings */
  from: string
  to: string
  /** soft translucent background for cards in light/dark */
  ring: string
}

// Soft pastel planner palette. Each todo/category picks one.
export const COLORS: Record<TodoColor, ColorDef> = {
  violet: { key: 'violet', label: 'Lavender', from: '196 181 253', to: '167 139 250', ring: '167 139 250' },
  blue: { key: 'blue', label: 'Blue', from: '147 197 253', to: '96 165 250', ring: '96 165 250' },
  cyan: { key: 'cyan', label: 'Sky', from: '165 243 252', to: '103 232 249', ring: '103 232 249' },
  emerald: { key: 'emerald', label: 'Mint', from: '134 239 172', to: '74 222 128', ring: '74 222 128' },
  amber: { key: 'amber', label: 'Sunny', from: '253 230 138', to: '252 211 77', ring: '250 204 21' },
  orange: { key: 'orange', label: 'Peach', from: '253 186 116', to: '251 146 60', ring: '251 146 60' },
  rose: { key: 'rose', label: 'Rose', from: '253 164 175', to: '251 113 133', ring: '251 113 133' },
  pink: { key: 'pink', label: 'Pink', from: '249 168 212', to: '244 114 182', ring: '244 114 182' },
}

export const COLOR_KEYS = Object.keys(COLORS) as TodoColor[]

export function gradient(color: TodoColor): string {
  const c = COLORS[color]
  return `linear-gradient(135deg, rgb(${c.from}) 0%, rgb(${c.to}) 100%)`
}

export function colorVars(color: TodoColor): React.CSSProperties {
  const c = COLORS[color]
  return {
    // consumed by components via var(--c-from) etc.
    ['--c-from' as string]: c.from,
    ['--c-to' as string]: c.to,
    ['--c-ring' as string]: c.ring,
  }
}
