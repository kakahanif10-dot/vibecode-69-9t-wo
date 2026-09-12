// VIBECODE INC. (c) 2026 — Layer 3 design engine
import { generateText } from 'ai'

export const maxDuration = 60

// Gemini 3.6 Flash via Vercel AI Gateway (zero-config auth in v0 previews + Vercel).
const MODEL = 'google/gemini-3.6-flash'

const SYSTEM_INSTRUCTION = `You are the Layer 3 design engine for Vibecode Inc.
The user describes an apparel / app-brand idea in any language.
Return ONLY a single minified JSON object (no markdown, no prose, no code fences) with EXACTLY these keys:
{
  "appName": string,        // short brand name, max 22 chars
  "garment": "tshirt" | "hoodie" | "tank",
  "garmentColor": string,   // hex like "#111111"
  "textColor": string,      // hex with strong contrast against garmentColor
  "slogan": string,         // 1-4 words printed on the garment, uppercase
  "description": string     // one friendly sentence describing the design
}
Pick colors that actually contrast. Keep slogan short enough to print on a chest.`

type DesignSpec = {
  appName: string
  garment: 'tshirt' | 'hoodie' | 'tank'
  garmentColor: string
  textColor: string
  slogan: string
  description: string
}

function extractJson(raw: string): DesignSpec | null {
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
    return parsed as DesignSpec
  } catch {
    return null
  }
}

const GARMENTS = new Set(['tshirt', 'hoodie', 'tank'])
const HEX = /^#?[0-9a-fA-F]{6}$/

function normalizeHex(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || !HEX.test(value.trim())) return fallback
  const v = value.trim()
  return v.startsWith('#') ? v : `#${v}`
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
    const { text } = await generateText({
      model: MODEL,
      system: SYSTEM_INSTRUCTION,
      prompt: userPrompt,
    })

    const parsed = extractJson(text)
    if (!parsed) {
      return Response.json(
        { success: false, error: 'Model did not return a valid design spec.' },
        { status: 502 },
      )
    }

    const spec: DesignSpec = {
      appName:
        typeof parsed.appName === 'string' && parsed.appName.trim()
          ? parsed.appName.trim().slice(0, 22)
          : 'Vibewear',
      garment:
        typeof parsed.garment === 'string' && GARMENTS.has(parsed.garment)
          ? parsed.garment
          : 'tshirt',
      garmentColor: normalizeHex(parsed.garmentColor, '#111111'),
      textColor: normalizeHex(parsed.textColor, '#ffffff'),
      slogan:
        typeof parsed.slogan === 'string' && parsed.slogan.trim()
          ? parsed.slogan.trim().toUpperCase().slice(0, 24)
          : 'VIBECODE',
      description:
        typeof parsed.description === 'string' && parsed.description.trim()
          ? parsed.description.trim()
          : 'A clean, original apparel concept generated on Layer 3.',
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
