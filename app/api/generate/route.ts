// VIBECODE INC. (c) 2026 — Universal App Generator engine

export const maxDuration = 60

// Google Gemini free-tier, called directly (bypasses Vercel AI Gateway — no card needed).
// The API key is read server-side only from GOOGLE_GENERATIVE_AI_API_KEY and never sent to the browser.
const MODEL = 'gemini-flash-latest'
// Ordered list of free-tier models to try when the primary is overloaded (503) or rate-limited (429).
const MODEL_FALLBACKS = ['gemini-flash-latest', 'gemini-flash-lite-latest'] as const
const endpointFor = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

const APP_TYPES = ['mobile', 'saas', 'landing', 'ecommerce'] as const
const COLOR_SCHEMES = [
  'monochrome',
  'cyberpunk',
  'enterprise',
  'emerald',
] as const

type AppType = (typeof APP_TYPES)[number]
type ColorScheme = (typeof COLOR_SCHEMES)[number]

const SYSTEM_INSTRUCTION = `You are the generation engine for Vibecode Inc., a UNIVERSAL multi-app generator.
The user describes any kind of software product in any language (a university portal, a coffee-shop menu, a medical/clinic app, a SaaS dashboard, a landing page, an online store, etc.).
Return ONLY a single minified JSON object (no markdown, no prose, no code fences) with EXACTLY these keys:
{
  "appName": string,        // short product/brand name, max 22 chars, derived from the idea
  "appType": "mobile" | "saas" | "landing" | "ecommerce",  // best fit for the described product
  "colorScheme": "monochrome" | "cyberpunk" | "enterprise" | "emerald",  // best fit for the brand/mood
  "tagline": string,        // punchy hero headline, max 48 chars
  "description": string,    // one friendly sentence describing the product
  "features": string[],     // exactly 4 short labels (2-3 words each) — screens, sections, menu items or stats that fit the product
  "primaryAction": string   // main call-to-action button label, 1-3 words (e.g. "Enroll now", "Order coffee", "Book appointment")
}
Choose appType and colorScheme that genuinely match the described product. Keep everything concise so it renders inside a device preview.`

type DesignSpec = {
  appName: string
  appType: AppType
  colorScheme: ColorScheme
  tagline: string
  description: string
  features: string[]
  primaryAction: string
  hasContent: boolean
}

function extractJson(raw: string): Record<string, unknown> | null {
  const cleaned = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1))
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

function pickEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback
}

function toFeatures(value: unknown): string[] {
  if (!Array.isArray(value)) return ['Overview', 'Details', 'Activity', 'Settings']
  const cleaned = value
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .map((v) => v.trim().slice(0, 22))
    .slice(0, 4)
  while (cleaned.length < 4) {
    cleaned.push(['Overview', 'Details', 'Activity', 'Settings'][cleaned.length])
  }
  return cleaned
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Transient upstream statuses worth retrying: overloaded, rate-limited, gateway hiccups.
const RETRYABLE = new Set([429, 500, 502, 503, 504])

class OverloadedError extends Error {}

// Try one model, retrying transient errors with exponential backoff.
async function requestModel(
  model: string,
  apiKey: string,
  userPrompt: string,
  attempts = 3,
): Promise<string> {
  let lastStatus = 0
  for (let attempt = 0; attempt < attempts; attempt++) {
    const res = await fetch(endpointFor(model), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Send the key as a header, not a query param, so it never lands in request/URL logs.
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    })

    if (res.ok) {
      const data = await res.json()
      return (
        data?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p?.text ?? '')
          .join('') ?? ''
      )
    }

    lastStatus = res.status
    const detail = await res.text().catch(() => '')

    if (RETRYABLE.has(res.status)) {
      // Back off (250ms, 500ms, 1s...) before retrying the same model.
      if (attempt < attempts - 1) await sleep(250 * 2 ** attempt)
      continue
    }

    // Non-transient (e.g. 400/401/404) — fail fast, keep key out of the text.
    throw new Error(
      `Gemini API error (${res.status})${detail ? `: ${detail.slice(0, 300)}` : ''}`,
    )
  }
  // Exhausted retries for this model with a transient status.
  throw new OverloadedError(`Model "${model}" unavailable (${lastStatus})`)
}

// Call Gemini's REST API directly, falling back across free-tier models when overloaded.
async function callGemini(userPrompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    throw new Error(
      'GOOGLE_GENERATIVE_AI_API_KEY is not set on the server. Add it in Project Settings → Environment Variables.',
    )
  }

  let overloaded: OverloadedError | null = null
  for (const model of MODEL_FALLBACKS) {
    try {
      return await requestModel(model, apiKey, userPrompt)
    } catch (err) {
      // Only advance to the next model on transient/overload failures.
      if (err instanceof OverloadedError) {
        overloaded = err
        continue
      }
      throw err
    }
  }
  throw new OverloadedError(
    overloaded?.message ?? 'All Gemini models are currently overloaded.',
  )
}

export async function POST(req: Request) {
  let userPrompt = ''
  try {
    const body = await req.json()
    userPrompt =
      typeof body?.userPrompt === 'string' ? body.userPrompt.trim() : ''
  } catch {
    return Response.json(
      { success: false, message: 'Invalid JSON body' },
      { status: 400 },
    )
  }

  if (!userPrompt) {
    return Response.json(
      { success: false, message: 'Prompt is required' },
      { status: 400 },
    )
  }

  try {
    const text = await callGemini(userPrompt)

    const parsed = extractJson(text)
    if (!parsed) {
      return Response.json(
        { success: false, error: 'Model did not return a valid app spec.' },
        { status: 502 },
      )
    }

    const appName =
      typeof parsed.appName === 'string' && parsed.appName.trim()
        ? parsed.appName.trim().slice(0, 22)
        : 'Untitled App'

    const spec: DesignSpec = {
      appName,
      appType: pickEnum(parsed.appType, APP_TYPES, 'mobile'),
      colorScheme: pickEnum(parsed.colorScheme, COLOR_SCHEMES, 'monochrome'),
      tagline:
        typeof parsed.tagline === 'string' && parsed.tagline.trim()
          ? parsed.tagline.trim().slice(0, 48)
          : appName,
      description:
        typeof parsed.description === 'string' && parsed.description.trim()
          ? parsed.description.trim()
          : 'A clean, original product concept generated by Vibecode Inc.',
      features: toFeatures(parsed.features),
      primaryAction:
        typeof parsed.primaryAction === 'string' && parsed.primaryAction.trim()
          ? parsed.primaryAction.trim().slice(0, 18)
          : 'Get started',
      hasContent: true,
    }

    return Response.json({
      success: true,
      company: 'Vibecode Inc.',
      model: MODEL,
      spec,
    })
  } catch (error) {
    if (error instanceof OverloadedError) {
      return Response.json(
        {
          success: false,
          error:
            'Gemini is experiencing high demand right now. This is temporary — please tap Generate again in a moment.',
        },
        { status: 503 },
      )
    }
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    )
  }
}
