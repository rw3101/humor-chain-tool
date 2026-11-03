/* eslint-disable @next/next/no-img-element */
'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { runChainAction, type RunResult } from './actions'

type ImageRow = { id: string; image_url: string; created_at: string }
type Selection = ImageRow | 'none' | null

const initialState: RunResult = { error: null, results: null, saveError: null }

function RunButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-indigo-600 px-6 py-2.5 font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Running…' : 'Run chain'}
    </button>
  )
}

export default function RunPanel({ chainId, images }: { chainId: string; images: ImageRow[] }) {
  const [selected, setSelected] = useState<Selection>(null)
  const [state, formAction] = useFormState(runChainAction.bind(null, chainId), initialState)

  if (selected === null) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">Pick a photo to run this chain against.</p>
          <button
            type="button"
            onClick={() => setSelected('none')}
            className="self-start rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
          >
            This chain doesn&apos;t need a photo →
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelected(img)}
              className="overflow-hidden rounded-xl border border-slate-200 hover:ring-2 hover:ring-indigo-500 dark:border-slate-700"
            >
              <img src={img.image_url} alt="" className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
        {images.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No photos found.</p>}
      </div>
    )
  }

  const isPhoto = selected !== 'none'

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-4">
        {isPhoto ? (
          <img src={selected.image_url} alt="" className="h-32 w-32 rounded-xl object-cover" />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500 dark:border-slate-600 dark:text-slate-400">
            No photo
          </div>
        )}
        <div className="flex flex-col items-start gap-2">
          <button type="button" onClick={() => setSelected(null)} className="text-sm underline">
            {isPhoto ? 'Choose a different photo' : 'Pick a photo instead'}
          </button>
          <form action={formAction}>
            {isPhoto && <input type="hidden" name="image_id" value={selected.id} />}
            <RunButton />
          </form>
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state.saveError && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          Run finished but could not be saved: {state.saveError}
        </p>
      )}

      {state.results && state.results.length > 0 && (
        <div className="flex flex-col gap-3">
          {state.results.map((r, i) => (
            <div
              key={r.step_id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Step {i + 1} · {r.name} · {r.model} · {r.latency_ms} ms
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{r.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
