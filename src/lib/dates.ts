import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  isSameDay,
  isToday as _isToday,
  addDays,
  subDays,
} from 'date-fns'

/** Canonical day key used everywhere: YYYY-MM-DD in local time. */
export function dayKey(d: Date = new Date()): string {
  return format(d, 'yyyy-MM-dd')
}

export function fromKey(key: string): Date {
  return parseISO(key)
}

export function prettyDay(key: string): string {
  const d = fromKey(key)
  if (_isToday(d)) return 'Today'
  const yst = subDays(new Date(), 1)
  if (isSameDay(d, yst)) return 'Yesterday'
  return format(d, 'EEE, d MMM')
}

export function longDay(key: string): string {
  return format(fromKey(key), 'EEEE, d MMMM yyyy')
}

export function weekdayIndex(key: string): number {
  return fromKey(key).getDay()
}

export function isTodayKey(key: string): boolean {
  return _isToday(fromKey(key))
}

export function shiftKey(key: string, days: number): string {
  return dayKey(days >= 0 ? addDays(fromKey(key), days) : subDays(fromKey(key), -days))
}

export interface Range {
  start: Date
  end: Date
  keys: string[]
  label: string
}

export function weekRange(ref: Date = new Date(), weekStartsOn: 0 | 1 = 1): Range {
  const start = startOfWeek(ref, { weekStartsOn })
  const end = endOfWeek(ref, { weekStartsOn })
  return {
    start,
    end,
    keys: eachDayOfInterval({ start, end }).map((d) => dayKey(d)),
    label: `${format(start, 'd MMM')} – ${format(end, 'd MMM')}`,
  }
}

export function monthRange(ref: Date = new Date()): Range {
  const start = startOfMonth(ref)
  const end = endOfMonth(ref)
  return {
    start,
    end,
    keys: eachDayOfInterval({ start, end }).map((d) => dayKey(d)),
    label: format(ref, 'MMMM yyyy'),
  }
}

export function yearRange(ref: Date = new Date()): Range {
  const start = startOfYear(ref)
  const end = endOfYear(ref)
  return {
    start,
    end,
    keys: eachDayOfInterval({ start, end }).map((d) => dayKey(d)),
    label: format(ref, 'yyyy'),
  }
}

export { format, eachDayOfInterval, startOfMonth, endOfMonth }
