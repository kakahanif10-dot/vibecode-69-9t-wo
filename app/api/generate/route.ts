// VIBECODE INC. (c) 2026 — Universal App Generator engine

export const maxDuration = 60

// Google Gemini free-tier, called directly (bypasses Vercel AI Gateway — no card needed).
// The API key is read server-side only from GOOGLE_GENERATIVE_AI_API_KEY and never sent to the browser.
const MODEL = 'gemini-flash-latest'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

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

// Call Gemini's REST API directly. Returns the raw model text.
async function callGemini(userPrompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    throw new Error(
      'GOOGLE_GENERATIVE_AI_API_KEY is not set on the server. Add it in Project Settings → Environment Variables.',
    )
  }

  const res = await fetch(GEMINI_ENDPOINT, {
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

  if (!res.ok) {
    // Surface Google's status but keep the key out of any error text.
    const detail = await res.text().catch(() => '')
    throw new Error(
      `Gemini API error (${res.status})${detail ? `: ${detail.slice(0, 300)}` : ''}`,
    )
  }

  const data = await res.json()
  const text: string =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p?.text ?? '')
      .join('') ?? ''
  return text
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
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    )
  }
}
