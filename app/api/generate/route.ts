// VIBECODE INC. (c) 2026 — Universal Context-Aware UI/UX Engine.
// Detects the industry from any prompt (any language) and emits an
// industry-aware app spec: functional multi-page template + matching palette
// + industry-specific catalog. Rendered 100% client-side (0 MB server storage).
// The reasoning core runs on the AI SDK over the Vercel AI Gateway (zero-config).

import { generateText } from 'ai'
import {
  TEMPLATE_PALETTES,
  TEMPLATES,
  type CatalogItem,
  type DesignSpec,
  type Palette,
  type Template,
} from '@/lib/design'

export const maxDuration = 60

// Reasoning core runs on the AI SDK over the Vercel AI Gateway (zero-config in
// v0 previews and Vercel deployments — no provider key or card required, auth is
// supplied automatically). Models are referenced with plain `provider/model` IDs.
const MODEL = 'google/gemini-3.5-flash'
// Ordered fallbacks tried when the primary model is overloaded or rate-limited.
const MODEL_FALLBACKS = ['google/gemini-3.5-flash', 'google/gemini-2.5-flash'] as const

const SYSTEM_INSTRUCTION = `You are the Universal Context-Aware UI/UX Engine for Vibecode Inc., reasoning like a senior product designer with 10 years of experience.
The user describes ANY software product in ANY language (SAMSAT / government tax portal, a coffee shop, a restaurant, an online store, a clinic, a SaaS tool, etc.).

Your job: analyse the industry keywords in the prompt and AUTONOMOUSLY brand the app so it feels like a real, established institution — never a blank uniform template.

Return ONLY a single minified JSON object (no markdown, no prose, no code fences) with EXACTLY these keys:
{
  "appName": string,        // short official-sounding product/brand name, max 22 chars
  "industry": string,       // human label of the detected industry, max 28 chars (e.g. "Government / Vehicle Tax")
  "template": "government" | "fintech" | "edutech" | "food" | "ecommerce" | "health" | "saas" | "generic",
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
- "government": public services, tax (SAMSAT), permits, ID/licensing. Use authoritative institutional colors — DEEP NAVY (#0A192F) background, SLATE SILVER (#8892B0) secondary text, an ALERT AMBER (#FF6B00) accent for anything payment/tax related. Catalog rows = payable services (name = service, price = amount due, meta = due date or status). Categories = service groups.
- "fintech": banks, digital wallets, payments, investing, crypto, insurance. Use TRUST + GROWTH colors — near-black vault background with a confident EMERALD/GREEN money accent (never a warning red for balances). Catalog rows = accounts, cards or transactions (name, price = balance or amount, meta = account type or date). Categories = money areas (Accounts, Cards, Invest, Pay).
- "edutech": schools, universities, online courses, e-learning, tutoring. Use FOCUSED, FRIENDLY colors — deep academic blue background with a bright blue accent. Catalog rows = courses/lessons (name, price = course fee or 0, meta = instructor, duration or level). Categories = subjects or levels.
- "food": coffee shops, cafes, restaurants, delivery. Use warm EARTH TONES — espresso browns, cream, forest green accent. Catalog rows = menu items (name, price, meta = short description). Categories = menu sections (Coffee, Pastries...).
- "ecommerce": online stores, marketplaces, retail. Use a BRIGHT LIGHT commercial theme — clean ivory (#F5F5F5) background, pearl-white (#FFFFFF) product cards, dark text, and a high-vis ORANGE (#EE4D2D) conversion accent (Shopee/Amazon-like). Catalog rows = products (name, price, meta = brand or short label). Categories = product categories.
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
    fintech: ['Accounts', 'Cards', 'Invest', 'Pay'],
    edutech: ['All Courses', 'Beginner', 'Popular', 'Certificates'],
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
    fintech: [
      { name: 'Main Balance', price: 12480500, meta: 'Savings · **** 4021' },
      { name: 'Virtual Card', price: 2350000, meta: 'Spending · **** 8890' },
      { name: 'Index Fund', price: 5600000, meta: '+4.2% this month' },
      { name: 'Bill Payment', price: 320000, meta: 'Electricity · due 3d' },
    ],
    edutech: [
      { name: 'Intro to Python', price: 0, meta: 'Beginner · 6h' },
      { name: 'UI/UX Foundations', price: 49, meta: 'Sari W. · 8h' },
      { name: 'Data Science Bootcamp', price: 129, meta: 'Certificate · 40h' },
      { name: 'Public Speaking', price: 29, meta: 'Intermediate · 4h' },
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

class OverloadedError extends Error {}

// Run the reasoning core through the AI SDK + Vercel AI Gateway, falling back
// across models when the primary is overloaded/rate-limited. The system prompt
// asks for a single JSON object; the raw text is validated downstream.
async function callEngine(userPrompt: string): Promise<string> {
  let lastError: unknown = null
  for (const model of MODEL_FALLBACKS) {
    try {
      const { text } = await generateText({
        model,
        system: SYSTEM_INSTRUCTION,
        prompt: userPrompt,
        temperature: 0.7,
      })
      if (text?.trim()) return text
      lastError = new Error(`Model "${model}" returned an empty response`)
    } catch (err) {
      // Advance to the next fallback model on any provider-side failure.
      lastError = err
    }
  }
  throw new OverloadedError(
    (lastError as Error)?.message ?? 'All engine models are currently overloaded.',
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
    const text = await callEngine(userPrompt)

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
            'The reasoning engine is experiencing high demand right now. This is temporary — please tap Generate again in a moment.',
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
