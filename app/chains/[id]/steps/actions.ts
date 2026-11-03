'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'

function fail(path: string, message: string): never {
  redirect(`${path}${path.includes('?') ? '&' : '?'}error=${encodeURIComponent(message)}`)
}

function readStepFields(formData: FormData, back: string) {
  const name = String(formData.get('name') ?? '').trim()
  const instruction = String(formData.get('instruction') ?? '').trim()
  const llmModelId = String(formData.get('llm_model_id') ?? '')

  if (!name) fail(back, 'Name is required.')
  if (name.length > 200) fail(back, 'Name must be 200 characters or less.')
  if (!instruction) fail(back, 'Instruction is required.')
  if (instruction.length > 5000) fail(back, 'Instruction is too long.')
  if (!/^\d+$/.test(llmModelId)) fail(back, 'Pick a model.')

  return { name, instruction, llm_model_id: Number(llmModelId) }
}

export async function createStep(chainId: string, formData: FormData) {
  const { supabase } = await requireAdmin()
  const back = `/chains/${chainId}/steps/new`
  const fields = readStepFields(formData, back)

  const { data: maxRow } = await supabase
    .from('prompt_chain_steps')
    .select('step_order')
    .eq('chain_id', chainId)
    .order('step_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextOrder = (maxRow?.step_order ?? 0) + 1

  const { error } = await supabase
    .from('prompt_chain_steps')
    .insert({ ...fields, chain_id: Number(chainId), step_order: nextOrder })
  if (error) fail(back, error.message)

  revalidatePath(`/chains/${chainId}`)
  redirect(`/chains/${chainId}?ok=Step added.`)
}

export async function updateStep(chainId: string, stepId: string, formData: FormData) {
  const { supabase } = await requireAdmin()
  const back = `/chains/${chainId}/steps/${stepId}`
  const fields = readStepFields(formData, back)

  const { data, error } = await supabase
    .from('prompt_chain_steps')
    .update(fields)
    .eq('id', stepId)
    .eq('chain_id', chainId)
    .select('id')
  if (error) fail(back, error.message)
  if (!data?.length) fail(back, 'Step not found.')

  revalidatePath(`/chains/${chainId}`)
  redirect(`/chains/${chainId}?ok=Step updated.`)
}

export async function deleteStep(chainId: string, stepId: string) {
  const { supabase } = await requireAdmin()
  const back = `/chains/${chainId}`

  const { data, error } = await supabase
    .from('prompt_chain_steps')
    .delete()
    .eq('id', stepId)
    .eq('chain_id', chainId)
    .select('id')
  if (error) {
    fail(back, error.code === '23503' ? 'This step still has responses recorded. Delete those first.' : error.message)
  }
  if (!data?.length) fail(back, 'Step not found.')

  revalidatePath(back)
  redirect(`${back}?ok=Step deleted.`)
}

export async function moveStep(chainId: string, stepId: string, direction: 'up' | 'down') {
  const { supabase } = await requireAdmin()
  const back = `/chains/${chainId}`

  const { error } = await supabase.rpc('chain_move_step', { p_step_id: Number(stepId), p_direction: direction })
  if (error) fail(back, error.message)

  revalidatePath(back)
  redirect(`${back}?ok=Reordered.`)
}
