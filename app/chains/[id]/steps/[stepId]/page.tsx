import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import AdminHeader from '@/components/admin-header'
import Notice from '@/components/notice'
import ConfirmButton from '@/components/confirm-button'
import { updateStep, deleteStep } from '../actions'

export const dynamic = 'force-dynamic'

export default async function EditStepPage({
  params,
  searchParams,
}: {
  params: { id: string; stepId: string }
  searchParams: { ok?: string; error?: string }
}) {
  const { supabase, user } = await requireAdmin()

  const { data: chain } = await supabase.from('prompt_chains').select('id, name').eq('id', params.id).maybeSingle()
  if (!chain) notFound()

  const { data: step } = await supabase
    .from('prompt_chain_steps')
    .select('id, chain_id, name, instruction, llm_model_id')
    .eq('id', params.stepId)
    .eq('chain_id', params.id)
    .maybeSingle()
  if (!step) notFound()

  // Include inactive models too, so a step already assigned to one still shows it correctly.
  const { data: models } = await supabase
    .from('llm_models')
    .select('id, name, is_active')
    .order('is_active', { ascending: false })
    .order('name', { ascending: true })

  const field =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'

  return (
    <div className="min-h-screen">
      <AdminHeader current="/" email={user.email} />

      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-8">
        <a href={`/chains/${chain.id}`} className="self-start text-sm underline">
          ← Back to chain
        </a>
        <h1 className="text-3xl font-extrabold tracking-tight">Edit step</h1>
        <Notice ok={searchParams.ok} error={searchParams.error} />

        <form
          action={updateStep.bind(null, String(chain.id), String(step.id))}
          className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <div>
            <label className="mb-1 block text-sm font-semibold">Name</label>
            <input name="name" defaultValue={step.name} required maxLength={200} className={field} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Instruction</label>
            <textarea name="instruction" defaultValue={step.instruction} required rows={5} className={field} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Model</label>
            <select name="llm_model_id" required className={field} defaultValue={String(step.llm_model_id ?? '')}>
              <option value="" disabled>
                Choose a model
              </option>
              {(models ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                  {!m.is_active ? ' (inactive)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="submit" className="rounded-full bg-indigo-600 px-6 py-2.5 font-semibold text-white hover:bg-indigo-500">
              Save changes
            </button>
            <ConfirmButton
              action={deleteStep.bind(null, String(chain.id), String(step.id))}
              message={`Delete step "${step.name}"?`}
              className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
            >
              Delete step
            </ConfirmButton>
          </div>
        </form>
      </main>
    </div>
  )
}
