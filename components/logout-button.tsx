'use client'

import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <button
      onClick={signOut}
      className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-semibold hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
    >
      Log out
    </button>
  )
}
