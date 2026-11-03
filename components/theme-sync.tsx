'use client'

import { useEffect } from 'react'
import { applyTheme, readStoredTheme } from '@/lib/theme'

// Mounted once in the root layout so every page - including /login and
// /denied, which don't render the theme toggle - keeps following the OS
// appearance live while "system" is selected, not just at initial load.
export default function ThemeSync() {
  useEffect(() => {
    const sync = () => {
      if (readStoredTheme() === 'system') applyTheme('system')
    }
    applyTheme(readStoredTheme())

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    // Safari before version 14 only has the deprecated addListener/removeListener pair.
    if (mq.addEventListener) mq.addEventListener('change', sync)
    else mq.addListener(sync)

    // Backstop: refocusing the tab re-checks too, in case a browser doesn't
    // fire the media query's change event while the tab is backgrounded.
    window.addEventListener('focus', sync)
    document.addEventListener('visibilitychange', sync)

    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', sync)
      else mq.removeListener(sync)
      window.removeEventListener('focus', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])

  return null
}
