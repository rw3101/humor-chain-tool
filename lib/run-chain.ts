export type RunStep = {
  id: number
  name: string
  instruction: string
  model: string // Gemini model id for this step
}

export type StepResult = {
  step_id: number
  model: string
  text: string
  raw: unknown
  latency_ms: number
  prompt_tokens: number | null
  completion_tokens: number | null
}

const FALLBACK_MODEL = 'gemini-3.5-flash-lite'
const RETRY_STATUSES = [500, 503, 504]

async function fetchImage(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not download the image (${res.status}).`)
  const type = res.headers.get('content-type') || 'image/jpeg'
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length > 8 * 1024 * 1024) throw new Error('Image is larger than 8 MB.')
  return { mime: type.split(';')[0], data: buf.toString('base64') }
}

async function callGemini(model: string, parts: unknown[]) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY is not set.')

  const models = model === FALLBACK_MODEL ? [model] : [model, FALLBACK_MODEL]
  let lastError = 'Gemini request failed.'

  for (const m of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({ contents: [{ role: 'user', parts }] }),
        }
      )
      if (res.ok) return { model: m, json: await res.json() }
      if (res.status === 429) {
        throw new Error('Gemini quota reached (429). Try again later.')
      }
      lastError = `Gemini returned ${res.status}.`
      if (!RETRY_STATUSES.includes(res.status)) throw new Error(lastError)
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)))
    }
  }
  throw new Error(lastError)
}

/**
 * Runs the steps in order. If an image is given, step 1 gets it (plus every
 * later step gets the previous step's text); chains that don't need a photo
 * can omit it and step 1 just gets its own instruction, like any other step.
 * Returns whatever finished, plus an error if one failed.
 */
export async function runChain(steps: RunStep[], imageUrl?: string | null) {
  const results: StepResult[] = []
  let error: string | null = null

  try {
    const image = imageUrl ? await fetchImage(imageUrl) : null
    let previous = ''

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const parts: unknown[] = []

      if (i === 0 && image) {
        parts.push({ inline_data: { mime_type: image.mime, data: image.data } })
        parts.push({ text: step.instruction })
      } else if (i === 0) {
        parts.push({ text: step.instruction })
      } else {
        parts.push({
          text: `${step.instruction}\n\nOutput of the previous step:\n${previous}`,
        })
      }

      const started = Date.now()
      const { model, json } = await callGemini(step.model, parts)
      const text: string =
        json?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p.text ?? '')
          .join('')
          .trim() ?? ''

      if (!text) throw new Error(`Step ${i + 1} (${step.name}) returned no text.`)

      results.push({
        step_id: step.id,
        model,
        text,
        raw: json,
        latency_ms: Date.now() - started,
        prompt_tokens: json?.usageMetadata?.promptTokenCount ?? null,
        completion_tokens: json?.usageMetadata?.candidatesTokenCount ?? null,
      })
      previous = text
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Run failed.'
  }

  return { results, error }
}