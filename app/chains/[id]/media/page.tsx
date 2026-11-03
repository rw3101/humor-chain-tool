/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import AdminHeader from '@/components/admin-header'

export const dynamic = 'force-dynamic'

const fmtDate = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'America/New_York',
      })
    : '—'

const statusBadge = (s: string) => (
  <span
    className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${
      s === 'completed'
        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
        : s === 'failed'
          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
    }`}
  >
    {s}
  </span>
)

export default async function ChainMediaPage({ params }: { params: { id: string } }) {
  const { supabase, user } = await requireAdmin()

  const { data: chain } = await supabase.from('prompt_chains').select('id, name').eq('id', params.id).maybeSingle()
  if (!chain) notFound()

  const { data } = await supabase
    .from('generation_requests')
    .select(
      'id, status, created_at, images(image_url), llm_responses(id, response_text, llm_models(name), prompt_chain_steps(step_order, name))'
    )
    .eq('chain_id', params.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const requests = (data ?? []) as any[]

  return (
    <div className="min-h-screen">
      <AdminHeader current="/" email={user.email} />

      <main className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-8">
        <a href={`/chains/${chain.id}`} className="self-start text-sm underline">
          ← Back to chain
        </a>
        <h1 className="text-3xl font-extrabold tracking-tight">Media for: {chain.name}</h1>
        <p className="text-slate-600 dark:text-slate-300">
          {requests.length} {requests.length === 1 ? 'run' : 'runs'}
        </p>

        <div className="flex flex-col gap-5">
          {requests.map((r) => {
            const steps = [...(r.llm_responses ?? [])].sort(
              (a: any, b: any) => (a.prompt_chain_steps?.step_order ?? 0) - (b.prompt_chain_steps?.step_order ?? 0)
            )
            return (
              <article
                key={r.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:flex-row"
              >
                {r.images?.image_url ? (
                  <img src={r.images.image_url} alt="" className="h-28 w-28 shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="h-28 w-28 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-700" />
                )}
                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {statusBadge(r.status)}
                    <span className="text-slate-500 dark:text-slate-400">{fmtDate(r.created_at)}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {steps.map((s: any, i: number) => (
                      <div key={s.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Step {i + 1} · {s.prompt_chain_steps?.name ?? '—'} · {s.llm_models?.name ?? '—'}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{s.response_text}</p>
                      </div>
                    ))}
                    {steps.length === 0 && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">No step output recorded.</p>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
          {requests.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
              No runs yet.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
