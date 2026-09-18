import { supabase } from './supabase'

export async function generateText(
  prompt: string,
  json = false
): Promise<string> {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session)
    throw new Error('Please sign in again to use your assistant.')
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session.access_token}`
    },
    body: JSON.stringify({ prompt, json }),
    signal: AbortSignal.timeout(55000)
  })
  if (!response.headers.get('content-type')?.includes('application/json'))
    throw new Error(
      'The AI service is unavailable. Check the server setup and try again.'
    )
  const result = await response.json()
  if (!response.ok)
    throw new Error(
      result.error ||
        'The assistant could not complete this request. Try again.'
    )
  if (typeof result.text !== 'string' || !result.text.trim())
    throw new Error('The assistant returned an empty response. Try again.')
  return result.text
}
