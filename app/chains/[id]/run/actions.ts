/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { requireAdmin } from '@/lib/admin'
import { runChain, type RunStep } from '@/lib/run-chain'

export type RunResult = {
  error: string | null
  results: { step_id: number; name: string; model: string; text: string; latency_ms: number }[] | null
  saveError: string | null
}

export async function runChainAction(chainId: string, _prevState: RunResult, formData: FormData): Promise<RunResult> {
  const { supabase } = await requireAdmin()
  const imageId = String(formData.get('image_id') ?? '').trim()

  let imageUrl: string | null = null
  let resolvedImageId: string | null = null
  if (imageId) {
    const { data: image } = await supabase.from('images').select('id, image_url').eq('id', imageId).maybeSingle()
    if (!image) return { error: 'That photo could not be found.', results: null, saveError: null }
    imageUrl = image.image_url
    resolvedImageId = image.id
  }

  const { data: stepsData } = await supabase
    .from('prompt_chain_steps')
    .select('id, name, instruction, llm_models(provider_model_id)')
    .eq('chain_id', chainId)
    .order('step_order', { ascending: true })

  const steps = (stepsData ?? []) as any[]
  if (steps.length === 0) return { error: 'This chain has no steps yet.', results: null, saveError: null }
  if (steps.some((s) => !s.llm_models?.provider_model_id)) {
    return { error: 'Every step needs a model with an API model id set.', results: null, saveError: null }
  }

  const runSteps: RunStep[] = steps.map((s) => ({
    id: s.id,
    name: s.name,
    instruction: s.instruction,
    model: s.llm_models.provider_model_id as string,
  }))

  const { results, error } = await runChain(runSteps, imageUrl)

  const nameById = new Map(steps.map((s) => [s.id, s.name]))
  const displayResults = results.map((r) => ({
    step_id: r.step_id,
    name: nameById.get(r.step_id) ?? `Step ${r.step_id}`,
    model: r.model,
    text: r.text,
    latency_ms: r.latency_ms,
  }))

  let saveError: string | null = null
  if (results.length > 0) {
    const { error: logError } = await supabase.rpc('chain_log_run', {
      p_chain_id: Number(chainId),
      p_image_id: resolvedImageId,
      p_status: error ? 'failed' : 'completed',
      p_steps: results.map((r) => ({
        step_id: r.step_id,
        model: r.model,
        text: r.text,
        raw: r.raw,
        latency_ms: r.latency_ms,
        prompt_tokens: r.prompt_tokens,
        completion_tokens: r.completion_tokens,
      })),
    })
    if (logError) saveError = logError.message
  }

  return { error, results: displayResults, saveError }
}
