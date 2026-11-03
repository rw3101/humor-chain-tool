import { requireAdmin } from '@/lib/admin'
import AdminHeader from '@/components/admin-header'
import Notice from '@/components/notice'
import { createChain } from '../actions'

export const dynamic = 'force-dynamic'

export default async function NewChainPage({ searchParams }: { searchParams: { error?: string } }) {
  const { user } = await requireAdmin()
  const field =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'

  return (
    <div className="min-h-screen">
      <AdminHeader current="/" email={user.email} />

      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-8">
        <a href="/" className="self-start text-sm underline">
          ← Back to chains
        </a>
        <h1 className="text-3xl font-extrabold tracking-tight">New chain</h1>
        <Notice error={searchParams.error} />

        <form
          action={createChain}
          className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <div>
            <label className="mb-1 block text-sm font-semibold">Name</label>
            <input name="name" required maxLength={200} className={field} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Description</label>
            <textarea name="description" rows={4} className={field} />
          </div>
          <button
            type="submit"
            className="self-start rounded-full bg-indigo-600 px-6 py-2.5 font-semibold text-white hover:bg-indigo-500"
          >
            Create chain
          </button>
        </form>
      </main>
    </div>
  )
}
