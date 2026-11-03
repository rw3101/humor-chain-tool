import { requireAdmin } from '@/lib/admin'
import AdminHeader from '@/components/admin-header'
import Notice from '@/components/notice'
import ConfirmButton from '@/components/confirm-button'
import { deleteChain } from './chains/actions'

export const dynamic = 'force-dynamic'

const fmtDate = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })
    : '—'

export default async function ChainsPage({
  searchParams,
}: {
  searchParams: { ok?: string; error?: string }
}) {
  const { supabase, user } = await requireAdmin()

  const { data, error } = await supabase
    .from('prompt_chains')
    .select('id, name, description, created_at, prompt_chain_steps(count)')
    .order('id', { ascending: true })

  const chains = (data ?? []) as {
    id: number
    name: string
    description: string | null
    created_at: string
    prompt_chain_steps: { count: number }[]
  }[]

  return (
    <div className="min-h-screen">
      <AdminHeader current="/" email={user.email} />

      <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Prompt chains</h1>
            <p className="text-slate-600 dark:text-slate-300">
              {chains.length} {chains.length === 1 ? 'chain' : 'chains'}
            </p>
          </div>
          <a
            href="/chains/new"
            className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            + New chain
          </a>
        </div>

        <Notice ok={searchParams.ok} error={searchParams.error ?? error?.message} />

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Steps</th>
                <th className="px-4 py-3">Added</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {chains.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0 dark:border-slate-700">
                  <td className="px-4 py-3 font-semibold">{c.name}</td>
                  <td className="px-4 py-3">
                    <span className="block max-w-md text-slate-600 dark:text-slate-300">{c.description ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-right">{c.prompt_chain_steps?.[0]?.count ?? 0}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fmtDate(c.created_at)}</td>
                  <td className="px-4 py-3">
                    <form className="flex items-center justify-end gap-2">
                      <a
                        href={`/chains/${c.id}/run`}
                        className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                      >
                        ▶ Run
                      </a>
                      <a
                        href={`/chains/${c.id}`}
                        className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                      >
                        Manage
                      </a>
                      <ConfirmButton
                        action={deleteChain.bind(null, String(c.id))}
                        message={`Delete the chain "${c.name}"? This cannot be undone.`}
                        className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        Delete
                      </ConfirmButton>
                    </form>
                  </td>
                </tr>
              ))}
              {chains.length === 0 && !error && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No chains yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
