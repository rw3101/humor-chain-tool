import LogoutButton from './logout-button'
import ThemeToggle from './theme-toggle'

const LINKS = [{ href: '/', label: 'Chains' }]

export default function AdminHeader({ current, email }: { current: string; email?: string }) {
  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-5">
          <span className="text-lg font-extrabold tracking-tight">⛓️ Prompt Chain Tool</span>
          <nav className="flex gap-1">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  current === l.href
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {email && <span className="hidden text-sm text-slate-500 dark:text-slate-400 sm:inline">{email}</span>}
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
