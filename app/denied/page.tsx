import LogoutButton from '@/components/logout-button'

export default function DeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-900 dark:bg-slate-800">
        <h1 className="text-xl font-extrabold">Access denied</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This account isn&apos;t authorized to use the prompt chain tool.
        </p>
        <LogoutButton />
      </div>
    </main>
  )
}
