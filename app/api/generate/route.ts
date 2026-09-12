// VIBECODE INC. (c) 2026 - ARCHITECTED BY KAKA
export const maxDuration = 60

const MODEL = 'gemini-3.6-flash'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

const SYSTEM_INSTRUCTION = `Anda adalah mesin rekayasa inti dari Vibecode Inc. Hasilkan HANYA kode JavaScript/TypeScript fungsional utuh React Native (Expo) yang siap dimasukkan ke file 'App.js'. JANGAN berikan penjelasan teks apa pun di luar kode. JANGAN gunakan markdown block.`

function stripCodeFence(text: string): string {
  const trimmed = text.trim()
  const fenceMatch = trimmed.match(/^```(?:[a-zA-Z]+)?\n([\s\S]*?)\n```$/)
  return fenceMatch ? fenceMatch[1].trim() : trimmed
}

export async function POST(req: Request) {
  let userPrompt = ''
  try {
    const body = await req.json()
    userPrompt = typeof body?.userPrompt === 'string' ? body.userPrompt.trim() : ''
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

  const apiKey = process.env.API_KEY
  if (!apiKey) {
    return Response.json(
      { success: false, message: 'API_KEY is not configured' },
      { status: 500 },
    )
  }

  try {
    const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
      }),
    })

    if (!res.ok) {
      const errorBody = await res.text()
      return Response.json(
        { success: false, message: `Gemini API error (${res.status})`, error: errorBody },
        { status: 502 },
      )
    }

    const data = await res.json()
    const rawText: string =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part?.text ?? '')
        .join('') ?? ''

    if (!rawText.trim()) {
      return Response.json(
        { success: false, message: 'Model returned an empty response' },
        { status: 502 },
      )
    }

    return Response.json({
      success: true,
      author: 'Kaka (Solo Pioneer)',
      company: 'Vibecode Inc.',
      generatedCode: stripCodeFence(rawText),
    })
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    )
  }
}
