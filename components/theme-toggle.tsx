'use client'

import { useEffect, useState } from 'react'
import { applyTheme, readStoredTheme, type ThemeMode } from '@/lib/theme'

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('system')

  useEffect(() => {
    setMode(readStoredTheme())
  }, [])

  function choose(next: ThemeMode) {
    setMode(next)
    try {
      localStorage.setItem('theme', next)
    } catch {}
    applyTheme(next)
  }

  const options: { value: ThemeMode; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ]

  return (
    <div
      role="group"
      aria-label="Theme"
      className="inline-flex overflow-hidden rounded-lg border border-slate-300 text-sm dark:border-slate-600"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => choose(o.value)}
          aria-pressed={mode === o.value}
          className={
            'px-3 py-1.5 ' +
            (mode === o.value
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700')
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
