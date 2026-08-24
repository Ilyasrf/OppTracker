import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY

if (!apiKey) {
  console.warn(
    '⚠️ Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.\n' +
    'Get a free key at: https://aistudio.google.com/apikey'
  )
}

export const genAI = new GoogleGenerativeAI(apiKey || '')

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2048,
  },
})
