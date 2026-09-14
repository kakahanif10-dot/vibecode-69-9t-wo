// VIBECODE INC. (c) 2026 — Universal Context-Aware UI/UX Engine.
// Detects the industry from any prompt (any language) and emits an
// industry-aware app spec: functional multi-page template + matching palette
// + industry-specific catalog. Rendered 100% client-side (0 MB server storage).

import {
  TEMPLATE_PALETTES,
  TEMPLATES,
  type CatalogItem,
  type DesignSpec,
  type Palette,
  type Template,
} from '@/lib/design'

export const maxDuration = 60

// Google Gemini free-tier, called directly (bypasses Vercel AI Gateway — no card needed).
// The API key is read server-side only from GOOGLE_GENERATIVE_AI_API_KEY and never sent to the browser.
const MODEL = 'gemini-flash-latest'
// Ordered list of free-tier models to try when the primary is overloaded (503) or rate-limited (429).
const MODEL_FALLBACKS = ['gemini-flash-latest', 'gemini-flash-lite-latest'] as const
const endpointFor = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

const SYSTEM_INSTRUCTION = `You are the Universal Context-Aware UI/UX Engine for Vibecode Inc., reasoning like a senior product designer with 10 years of experience.
The user describes ANY software product in ANY language (SAMSAT / government tax portal, a coffee shop, a restaurant, an online store, a clinic, a SaaS tool, etc.).

Your job: analyse the industry keywords in the prompt and AUTONOMOUSLY brand the app so it feels like a real, established institution — never a blank uniform template.

Return ONLY a single minified JSON object (no markdown, no prose, no code fences) with EXACTLY these keys:
{
  "appName": string,        // short official-sounding product/brand name, max 22 chars
  "industry": string,       // human label of the detected industry, max 28 chars (e.g. "Government / Vehicle Tax")
  "template": "government" | "food" | "ecommerce" | "health" | "saas" | "generic",
  "currency": string,       // currency symbol that fits the locale of the idea ("Rp", "$", "€"...), max 3 chars
  "tagline": string,        // punchy hero headline, max 48 chars
  "description": string,    // one friendly sentence describing the product
  "primaryAction": string,  // main call-to-action label, 1-3 words (e.g. "Bayar Pajak", "Order coffee", "Checkout")
  "palette": {              // industry-appropriate colors as #RRGGBB hex
    "bg": string, "surface": string, "text": string, "muted": string, "accent": string, "accentText": string
  },
  "categories": string[],   // 3-5 short filter/section labels that fit the product (2-3 words each)
  "catalog": [              // 4-6 real, industry-specific rows
    { "name": string, "price": number, "meta": string }
  ]
}

TEMPLATE RULES (pick the best fit):
- "government": public services, tax (SAMSAT), permits, ID/licensing. Use authoritative institutional colors — navy blue background, steel greys, an ORANGE warning accent for anything payment/tax related. Catalog rows = payable services (name = service, price = amount due, meta = due date or status). Categories = service groups.
- "food": coffee shops, cafes, restaurants, delivery. Use warm EARTH TONES — espresso browns, cream, forest green accent. Catalog rows = menu items (name, price, meta = short description). Categories = menu sections (Coffee, Pastries...).
- "ecommerce": online stores, marketplaces, retail. Use bright high-conversion colors (vivid orange/red accent like Shopee/Amazon). Catalog rows = products (name, price, meta = brand or short label). Categories = product categories.
- "health": clinics, hospitals, pharmacies, telemedicine, wellness. Use CLEAN CLINICAL colors — deep teal background, soft surfaces, a trustworthy teal/green accent (never alarming red). Catalog rows = services/appointments/medicines (name, price = consult/med fee or 0, meta = doctor, duration or dosage). Categories = specialties (Dentist, Cardiology, Pharmacy...).
- "saas": software tools, dashboards, productivity, B2B platforms. Use MODERN SLEEK colors — near-black background with a confident violet/indigo accent. Catalog rows = plans or feature modules (name, price = plan price or 0, meta = short benefit). Categories = feature areas or plan tiers.
- "generic": anything else. Clean neutral palette with a confident accent. Catalog rows = key features/screens (price 0, meta = short benefit). Categories = sections.

Choose colors that genuinely match the brand psychology of the detected industry. Keep every string concise so it renders inside a phone preview.`

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

function str(value: unknown, max: number, fallback = ''): string {
  return typeof value === 'string' && value.trim()
    ? value.trim().slice(0, max)
    : fallback
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

// Merge AI-supplied hex values over the template defaults; ignore anything invalid.
function toPalette(value: unknown, template: Template): Palette {
  const base = TEMPLATE_PALETTES[template]
  if (!value || typeof value !== 'object') return base
  const v = value as Record<string, unknown>
  const hex = (k: keyof Palette): string =>
    typeof v[k] === 'string' && HEX.test((v[k] as string).trim())
      ? (v[k] as string).trim()
      : base[k]
  return {
    bg: hex('bg'),
    surface: hex('surface'),
    border: base.border, // keep the tuned translucent border from the template
    text: hex('text'),
    muted: hex('muted'),
    accent: hex('accent'),
    accentText: hex('accentText'),
  }
}

function toCategories(value: unknown, template: Template): string[] {
  const fallback: Record<Template, string[]> = {
    government: ['Tax', 'Permits', 'Licenses', 'Fines'],
    food: ['Coffee', 'Pastries', 'Tea', 'Specials'],
    ecommerce: ['Popular', 'New', 'Deals', 'Top rated'],
    health: ['General', 'Dentist', 'Cardiology', 'Pharmacy'],
    saas: ['Starter', 'Pro', 'Team', 'Enterprise'],
    generic: ['Overview', 'Explore', 'Popular', 'Recent'],
  }
  if (!Array.isArray(value)) return fallback[template]
  const cleaned = value
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .map((x) => x.trim().slice(0, 18))
    .slice(0, 5)
  return cleaned.length ? cleaned : fallback[template]
}

function toCatalog(value: unknown, template: Template): CatalogItem[] {
  const fallback: Record<Template, CatalogItem[]> = {
    government: [
      { name: 'Annual Vehicle Tax', price: 1250000, meta: 'Due in 12 days' },
      { name: 'License Renewal', price: 350000, meta: 'Active' },
      { name: 'Late Penalty', price: 75000, meta: 'Outstanding' },
      { name: 'Ownership Transfer', price: 500000, meta: 'Available' },
    ],
    food: [
      { name: 'Espresso', price: 3.5, meta: 'Double shot' },
      { name: 'Cappuccino', price: 4.5, meta: 'Silky microfoam' },
      { name: 'Cold Brew', price: 5, meta: '18h steep' },
      { name: 'Butter Croissant', price: 3.75, meta: 'Baked daily' },
    ],
    ecommerce: [
      { name: 'Wireless Buds', price: 59, meta: 'Best seller' },
      { name: 'Smart Watch', price: 129, meta: 'New' },
      { name: 'Canvas Backpack', price: 42, meta: 'Deal' },
      { name: 'Desk Lamp', price: 28, meta: 'Top rated' },
    ],
    health: [
      { name: 'General Consultation', price: 150000, meta: 'Dr. Sari · 20 min' },
      { name: 'Dental Cleaning', price: 300000, meta: 'Dr. Rian · 30 min' },
      { name: 'Blood Test Panel', price: 220000, meta: 'Lab · fasting' },
      { name: 'Paracetamol 500mg', price: 25000, meta: '10 tablets' },
    ],
    saas: [
      { name: 'Starter', price: 0, meta: 'Up to 3 projects' },
      { name: 'Pro', price: 19, meta: 'Unlimited projects' },
      { name: 'Team', price: 49, meta: 'Roles & SSO' },
      { name: 'Analytics Module', price: 0, meta: 'Real-time insights' },
    ],
    generic: [
      { name: 'Dashboard', price: 0, meta: 'Live overview' },
      { name: 'Insights', price: 0, meta: 'Trends & stats' },
      { name: 'Activity', price: 0, meta: 'Recent events' },
      { name: 'Settings', price: 0, meta: 'Preferences' },
    ],
  }
  if (!Array.isArray(value)) return fallback[template]
  const cleaned: CatalogItem[] = value
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((x) => ({
      name: str(x.name, 32, 'Item'),
      price:
        typeof x.price === 'number' && isFinite(x.price) && x.price >= 0
          ? Math.round(x.price * 100) / 100
          : 0,
      meta: str(x.meta, 28),
    }))
    .filter((x) => x.name && x.name !== 'Item')
    .slice(0, 6)
  return cleaned.length ? cleaned : fallback[template]
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

    const template = pickEnum(parsed.template, TEMPLATES, 'generic')
    const appName = str(parsed.appName, 22, 'Untitled App')

    const spec: DesignSpec = {
      appName,
      industry: str(parsed.industry, 28, 'Universal App'),
      template,
      palette: toPalette(parsed.palette, template),
      currency: str(parsed.currency, 3, '$'),
      tagline: str(parsed.tagline, 48, appName),
      description: str(
        parsed.description,
        160,
        'A clean, original product concept generated by Vibecode Inc.',
      ),
      primaryAction: str(parsed.primaryAction, 18, 'Get started'),
      categories: toCategories(parsed.categories, template),
      catalog: toCatalog(parsed.catalog, template),
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
