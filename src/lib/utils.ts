import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Small stable id (no external dep). */
export function uid(prefix = ''): string {
  return (
    prefix +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  )
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`
}

/** Haptic feedback on supported devices. */
export function haptic(ms = 12): void {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* noop */
  }
}
