/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import AdminHeader from '@/components/admin-header'
import RunPanel from './run-panel'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export default async function RunChainPage({ params }: { params: { id: string } }) {
  const { supabase, user } = await requireAdmin()

  const { data: chain } = await supabase.from('prompt_chains').select('id, name').eq('id', params.id).maybeSingle()
  if (!chain) notFound()

  const { count: stepCount } = await supabase
    .from('prompt_chain_steps')
    .select('id', { count: 'exact', head: true })
    .eq('chain_id', params.id)

  const { data: images } = await supabase
    .from('images')
    .select('id, image_url, created_at')
    .order('created_at', { ascending: false })
    .limit(60)

  return (
    <div className="min-h-screen">
      <AdminHeader current="/" email={user.email} />

      <main className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-8">
        <a href={`/chains/${chain.id}`} className="self-start text-sm underline">
          ← Back to chain
        </a>
        <h1 className="text-3xl font-extrabold tracking-tight">Run: {chain.name}</h1>

        {!stepCount ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
            This chain has no steps yet.{' '}
            <a href={`/chains/${chain.id}/steps/new`} className="underline">
              Add a step first.
            </a>
          </p>
        ) : (
          <RunPanel chainId={String(chain.id)} images={(images ?? []) as any[]} />
        )}
      </main>
    </div>
  )
}
