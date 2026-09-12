// VIBECODE INC. (c) 2026 - ARCHITECTED BY KAKA
import { generateText } from 'ai'

export const maxDuration = 60

const SYSTEM_INSTRUCTION = `Anda adalah mesin rekayasa inti dari Vibecode Inc. Hasilkan HANYA kode JavaScript/TypeScript fungsional utuh React Native (Expo) yang siap dimasukkan ke file 'App.js'. JANGAN berikan penjelasan teks apa pun di luar kode. JANGAN gunakan markdown block.`

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

  try {
    const { text } = await generateText({
      model: 'google/gemini-3.8-flash',
      system: SYSTEM_INSTRUCTION,
      prompt: userPrompt,
    })

    return Response.json({
      success: true,
      author: 'Kaka (Solo Pioneer)',
      company: 'Vibecode Inc.',
      generatedCode: text,
    })
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    )
  }
}
