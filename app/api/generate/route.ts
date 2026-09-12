// VIBECODE INC. (c) 2026 — Universal App Generator engine

import { generateText } from 'ai'

export const maxDuration = 60

// Routed through the Vercel AI Gateway (zero-config auth in v0 previews and Vercel
// deployments — no provider API key needed). Model IDs use the `provider/model` form.
const MODEL = 'google/gemini-2.5-flash'
// Ordered list of models to try when the primary is overloaded or rate-limited.
const MODEL_FALLBACKS = ['google/gemini-2.5-flash', 'google/gemini-2.5-flash-lite'] as const

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

class OverloadedError extends Error {}

// Heuristic: is this a transient/overload error worth retrying or falling back on?
function isTransient(err: unknown): boolean {
  const status =
    typeof (err as { statusCode?: number })?.statusCode === 'number'
      ? (err as { statusCode: number }).statusCode
      : undefined
  if (status && [429, 500, 502, 503, 504].includes(status)) return true
  const msg = (err as Error)?.message?.toLowerCase() ?? ''
  return (
    msg.includes('overload') ||
    msg.includes('rate limit') ||
    msg.includes('unavailable') ||
    msg.includes('timeout') ||
    msg.includes('503') ||
    msg.includes('429')
  )
}

// Try one model via the AI Gateway, retrying transient errors with exponential backoff.
async function requestModel(
  model: string,
  userPrompt: string,
  attempts = 3,
): Promise<string> {
  let lastErr: unknown = null
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const { text } = await generateText({
        model,
        system: SYSTEM_INSTRUCTION,
        prompt: userPrompt,
      })
      return text
    } catch (err) {
      lastErr = err
      if (isTransient(err)) {
        // Back off (250ms, 500ms, 1s...) before retrying the same model.
        if (attempt < attempts - 1) await sleep(250 * 2 ** attempt)
        continue
      }
      // Non-transient — fail fast.
      throw err
    }
  }
  // Exhausted retries for this model with a transient error.
  throw new OverloadedError(
    `Model "${model}" unavailable${
      (lastErr as Error)?.message ? `: ${(lastErr as Error).message}` : ''
    }`,
  )
}

// Generate the app spec via the AI Gateway, falling back across models when overloaded.
async function callGemini(userPrompt: string): Promise<string> {
  let overloaded: OverloadedError | null = null
  for (const model of MODEL_FALLBACKS) {
    try {
      return await requestModel(model, userPrompt)
    } catch (err) {
      // Only advance to the next model on transient/overload failures.
      if (err instanceof OverloadedError) {
        overloaded = err
        continue
      }
      if (isTransient(err)) {
        overloaded = new OverloadedError((err as Error).message)
        continue
      }
      throw err
    }
  }
  throw new OverloadedError(
    overloaded?.message ?? 'All models are currently overloaded.',
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
