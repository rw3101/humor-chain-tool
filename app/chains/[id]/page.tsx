/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import AdminHeader from '@/components/admin-header'
import Notice from '@/components/notice'
import ConfirmButton from '@/components/confirm-button'
import { updateChain, deleteChain } from '../actions'
import { deleteStep, moveStep } from './steps/actions'

export const dynamic = 'force-dynamic'

const clip = (s?: string | null, n = 160) => (!s ? '—' : s.length > n ? `${s.slice(0, n)}…` : s)

export default async function EditChainPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { ok?: string; error?: string }
}) {
  const { supabase, user } = await requireAdmin()

  const { data: chain } = await supabase
    .from('prompt_chains')
    .select('id, name, description, created_at')
    .eq('id', params.id)
    .maybeSingle()
  if (!chain) notFound()

  const { data: stepsData } = await supabase
    .from('prompt_chain_steps')
    .select('id, step_order, name, instruction, llm_model_id, llm_models(name)')
    .eq('chain_id', params.id)
    .order('step_order', { ascending: true })

  const steps = (stepsData ?? []) as any[]

  const field =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'

  return (
    <div className="min-h-screen">
      <AdminHeader current="/" email={user.email} />

      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-8">
        <a href="/" className="self-start text-sm underline">
          ← Back to chains
        </a>

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Chain</p>
              <h1 className="text-3xl font-extrabold tracking-tight">{chain.name}</h1>
            </div>
            <div className="flex gap-2">
              <a
                href={`/chains/${chain.id}/media`}
                className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
              >
                📷 View media
              </a>
              <a
                href={`/chains/${chain.id}/run`}
                className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                ▶ Run chain
              </a>
            </div>
          </div>
          <Notice ok={searchParams.ok} error={searchParams.error} />

          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Chain details</h2>

          <form
            action={updateChain.bind(null, String(chain.id))}
            className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <div>
              <label className="mb-1 block text-sm font-semibold">Name</label>
              <input name="name" defaultValue={chain.name} required maxLength={200} className={field} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">Description</label>
              <textarea name="description" defaultValue={chain.description ?? ''} rows={4} className={field} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button type="submit" className="rounded-full bg-indigo-600 px-6 py-2.5 font-semibold text-white hover:bg-indigo-500">
                Save changes
              </button>
              <ConfirmButton
                action={deleteChain.bind(null, String(chain.id))}
                message={`Delete the chain "${chain.name}"? This cannot be undone.`}
                className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
              >
                Delete chain
              </ConfirmButton>
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Steps</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {steps.length} {steps.length === 1 ? 'step' : 'steps'}, run in order
              </p>
            </div>
            <a
              href={`/chains/${chain.id}/steps/new`}
              className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              + Add step
            </a>
          </div>

          <div className="flex flex-col gap-3">
            {steps.map((s, i) => (
              <div
                key={s.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex gap-3">
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <form>
                      <button
                        type="submit"
                        formAction={moveStep.bind(null, String(chain.id), String(s.id), 'up')}
                        disabled={i === 0}
                        aria-label="Move up"
                        className="rounded-md border border-slate-300 px-2 py-0.5 text-xs disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-600 dark:hover:bg-slate-700"
                      >
                        ↑
                      </button>
                    </form>
                    <span className="text-xs font-semibold text-slate-400">{s.step_order}</span>
                    <form>
                      <button
                        type="submit"
                        formAction={moveStep.bind(null, String(chain.id), String(s.id), 'down')}
                        disabled={i === steps.length - 1}
                        aria-label="Move down"
                        className="rounded-md border border-slate-300 px-2 py-0.5 text-xs disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-600 dark:hover:bg-slate-700"
                      >
                        ↓
                      </button>
                    </form>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold">{s.name}</p>
                    <p className="max-w-md text-sm text-slate-600 dark:text-slate-300">{clip(s.instruction)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Model: {s.llm_models?.name ?? '—'}</p>
                  </div>
                </div>
                <form className="flex shrink-0 items-center gap-2">
                  <a
                    href={`/chains/${chain.id}/steps/${s.id}`}
                    className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                  >
                    Edit
                  </a>
                  <ConfirmButton
                    action={deleteStep.bind(null, String(chain.id), String(s.id))}
                    message={`Delete step "${s.name}"?`}
                    className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    Delete
                  </ConfirmButton>
                </form>
              </div>
            ))}
            {steps.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
                No steps yet. Add the first one above.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
