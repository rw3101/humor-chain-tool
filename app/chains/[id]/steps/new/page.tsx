import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import AdminHeader from '@/components/admin-header'
import Notice from '@/components/notice'
import { createStep } from '../actions'

export const dynamic = 'force-dynamic'

export default async function NewStepPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { error?: string }
}) {
  const { supabase, user } = await requireAdmin()

  const { data: chain } = await supabase.from('prompt_chains').select('id, name').eq('id', params.id).maybeSingle()
  if (!chain) notFound()

  const { data: models } = await supabase
    .from('llm_models')
    .select('id, name')
    .eq('is_active', true)
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
        <h1 className="text-3xl font-extrabold tracking-tight">New step</h1>
        <Notice error={searchParams.error} />

        <form
          action={createStep.bind(null, String(chain.id))}
          className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <div>
            <label className="mb-1 block text-sm font-semibold">Name</label>
            <input name="name" required maxLength={200} className={field} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Instruction</label>
            <textarea
              name="instruction"
              required
              rows={5}
              className={field}
              placeholder="What should this step do with its input?"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Model</label>
            <select name="llm_model_id" required className={field} defaultValue="">
              <option value="" disabled>
                Choose a model
              </option>
              {(models ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {(models ?? []).length === 0 && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                No active models found. Add one in the admin area first.
              </p>
            )}
          </div>
          <button
            type="submit"
            className="self-start rounded-full bg-indigo-600 px-6 py-2.5 font-semibold text-white hover:bg-indigo-500"
          >
            Add step
          </button>
        </form>
      </main>
    </div>
  )
}
