// Hand-drawn planner doodles scattered behind the app — sparkles, clouds,
// squiggles, dots & tiny flowers, echoing the paper-planner reference.

const stroke = 'rgb(var(--content) / 0.16)'

function Sparkle({ s = 1 }: { s?: number }) {
  return (
    <svg width={26 * s} height={26 * s} viewBox="0 0 26 26" fill="none">
      <path d="M13 1 C13 8 8 13 1 13 C8 13 13 18 13 25 C13 18 18 13 25 13 C18 13 13 8 13 1Z" fill={stroke} />
    </svg>
  )
}
function Squiggle() {
  return (
    <svg width="52" height="16" viewBox="0 0 52 16" fill="none">
      <path d="M2 8 C6 2 10 2 14 8 S22 14 26 8 S34 2 38 8 S46 14 50 8" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
function Cloud() {
  return (
    <svg width="60" height="34" viewBox="0 0 60 34" fill="none">
      <path d="M14 28 C6 28 4 20 10 17 C9 8 20 6 24 13 C27 6 40 6 41 15 C50 13 54 24 46 28 Z" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  )
}
function Flower() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
      <g stroke={stroke} strokeWidth="2" strokeLinecap="round">
        <path d="M15 6 C11 6 11 13 15 13 C19 13 19 6 15 6Z" />
        <path d="M24 15 C24 11 17 11 17 15 C17 19 24 19 24 15Z" />
        <path d="M15 24 C19 24 19 17 15 17 C11 17 11 24 15 24Z" />
        <path d="M6 15 C6 19 13 19 13 15 C13 11 6 11 6 15Z" />
      </g>
    </svg>
  )
}
function Dots() {
  return (
    <svg width="34" height="20" viewBox="0 0 34 20" fill={stroke}>
      <circle cx="4" cy="10" r="3" />
      <circle cx="17" cy="5" r="3" />
      <circle cx="30" cy="12" r="3" />
    </svg>
  )
}
function Spiral() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
      <path d="M15 15 m0 0 a3 3 0 1 1 3 3 a6 6 0 1 1 -6 -6 a9 9 0 1 1 9 9" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

interface Spot {
  el: React.ReactNode
  top: string
  left?: string
  right?: string
  r?: number
  delay?: number
}

const SPOTS: Spot[] = [
  { el: <Cloud />, top: '4%', left: '-2%', r: -6, delay: 0 },
  { el: <Sparkle s={0.9} />, top: '9%', right: '8%', r: 8, delay: 0.6 },
  { el: <Spiral />, top: '3%', right: '-2%', r: 0, delay: 1.1 },
  { el: <Flower />, top: '30%', left: '3%', r: -10, delay: 0.3 },
  { el: <Dots />, top: '24%', right: '4%', r: 0, delay: 0.9 },
  { el: <Squiggle />, top: '52%', left: '-4%', r: -12, delay: 0.2 },
  { el: <Sparkle s={0.7} />, top: '46%', right: '6%', r: 0, delay: 1.4 },
  { el: <Flower />, top: '72%', right: '2%', r: 12, delay: 0.5 },
  { el: <Cloud />, top: '84%', left: '-3%', r: 6, delay: 1.0 },
  { el: <Dots />, top: '66%', left: '5%', r: 0, delay: 0.7 },
]

export function Doodles() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 mx-auto max-w-md overflow-hidden">
      {SPOTS.map((s, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: s.top,
            left: s.left,
            right: s.right,
            ['--r' as string]: `${s.r ?? 0}deg`,
            transform: `rotate(${s.r ?? 0}deg)`,
            animation: `floaty ${6 + (i % 4)}s ease-in-out ${s.delay ?? 0}s infinite`,
          }}
        >
          {s.el}
        </div>
      ))}
    </div>
  )
}
