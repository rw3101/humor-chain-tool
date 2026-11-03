export type ThemeMode = 'light' | 'dark' | 'system'

export function prefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function readStoredTheme(): ThemeMode {
  try {
    const s = localStorage.getItem('theme')
    if (s === 'light' || s === 'dark' || s === 'system') return s
  } catch {}
  return 'system'
}

export function applyTheme(mode: ThemeMode) {
  const dark = mode === 'dark' || (mode === 'system' && prefersDark())
  document.documentElement.classList.toggle('dark', dark)
}
