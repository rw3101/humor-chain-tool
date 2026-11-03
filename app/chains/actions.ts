'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'

function fail(path: string, message: string): never {
  redirect(`${path}${path.includes('?') ? '&' : '?'}error=${encodeURIComponent(message)}`)
}

function readChainFields(formData: FormData, back: string) {
  const name = String(formData.get('name') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  if (!name) fail(back, 'Name is required.')
  if (name.length > 200) fail(back, 'Name must be 200 characters or less.')
  if (description.length > 5000) fail(back, 'Description is too long.')
  return { name, description: description || null }
}

export async function createChain(formData: FormData) {
  const { supabase } = await requireAdmin()
  const back = '/chains/new'
  const payload = readChainFields(formData, back)

  const { error } = await supabase.from('prompt_chains').insert(payload)
  if (error) fail(back, error.message)

  revalidatePath('/')
  redirect('/?ok=Chain created.')
}

export async function updateChain(chainId: string, formData: FormData) {
  const { supabase } = await requireAdmin()
  const back = `/chains/${chainId}`
  const payload = readChainFields(formData, back)

  const { data, error } = await supabase
    .from('prompt_chains')
    .update(payload)
    .eq('id', chainId)
    .select('id')
  if (error) fail(back, error.message)
  if (!data?.length) fail(back, 'Chain not found.')

  revalidatePath('/')
  revalidatePath(back)
  redirect(`${back}?ok=Changes saved.`)
}

export async function deleteChain(chainId: string) {
  const { supabase } = await requireAdmin()

  const { data, error } = await supabase.from('prompt_chains').delete().eq('id', chainId).select('id')
  if (error) {
    fail('/', error.code === '23503' ? 'This chain still has steps or generation requests. Delete those first.' : error.message)
  }
  if (!data?.length) fail('/', 'Chain not found.')

  revalidatePath('/')
  redirect('/?ok=Chain deleted.')
}
