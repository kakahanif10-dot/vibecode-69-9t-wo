// api/generate.js
// VIBECODE INC. (c) 2026 - ARCHITECTED BY KAKA
import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { userPrompt } = req.body;

  try {
    // Memanggil otak AI menggunakan kunci rahasia yang Anda simpan di brankas Vercel tadi
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemInstruction = `
      Anda adalah mesin rekayasa inti dari Vibecode Inc. Hasilkan HANYA kode JavaScript/TypeScript fungsional utuh 
      React Native (Expo) yang siap dimasukkan ke file 'App.js'. JANGAN berikan penjelasan teks apa pun di luar kode.
      JANGAN gunakan markdown block \`\`\`.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'system', parts: [{ text: systemInstruction }] },
        { role: 'user', parts: [{ text: userPrompt }] }
      ]
    });

    return res.status(200).json({
      success: true,
      author: 'Kaka (Solo Pioneer)',
      company: 'Vibecode Inc.',
      generatedCode: response.text
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
