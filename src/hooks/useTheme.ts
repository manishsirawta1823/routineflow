import { useEffect } from 'react'
import { useStore } from '@/store/useStore'

/** Applies the current theme setting to <html> and reacts to system changes. */
export function useTheme() {
  const theme = useStore((s) => s.settings.theme)

  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches)
      root.classList.toggle('dark', dark)
      const meta = document.querySelector('meta[name="theme-color"]')
      meta?.setAttribute('content', dark ? '#17151f' : '#e9eefb')
    }

    apply()
    if (theme === 'system') {
      media.addEventListener('change', apply)
      return () => media.removeEventListener('change', apply)
    }
  }, [theme])

  return theme
}
