import { useState } from 'react'
import { generateText } from '../lib/gemini'
import { safeUrl } from '../lib/notifications'
import { CATEGORY_LABELS, FUNDING_LABELS } from '../lib/types'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Opportunity, FundingType, Category } from '../lib/types'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface AnalyzedOpportunity {
  title: string
  url: string | null
  deadline: string | null
  funding_type: FundingType
  location: string | null
  category: Category
  travel_accommodation: string | null
  requirements: string[]
  scam_score: number
  red_flags: string[]
  summary: string
}

export interface ScamAnalysis {
  scam_score: number
  red_flags: string[]
  green_flags: string[]
  recommendation: string
  summary: string
}

export interface UserProfile {
  name: string
  email: string
  skills: string
  background: string
  interests: string
}

async function getProfile(userId: string | undefined): Promise<UserProfile> {
  if (!userId)
    return { name: '', email: '', skills: '', background: '', interests: '' }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error)
    throw new Error(
      'Could not load your profile. Try again before generating a letter.'
    )
  if (data) {
    return {
      name: data.name || '',
      email: data.email || '',
      skills: data.skills || '',
      background: data.background || '',
      interests: data.interests || ''
    }
  }
  return { name: '', email: '', skills: '', background: '', interests: '' }
}

export async function saveProfile(
  userId: string | undefined,
  profile: UserProfile
) {
  if (!userId) throw new Error('Please sign in again.')
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...profile })
  if (error) throw new Error('Could not save your profile. Please try again.')
}

function opportunitiesToContext(opportunities: Opportunity[]): string {
  if (opportunities.length === 0) return 'No opportunities in the notebook yet.'
  return opportunities
    .map(
      (o) =>
        `- ${o.title} | Status: ${o.status} | Funding: ${o.funding_type} | Category: ${o.category} | Location: ${o.location || 'N/A'} | Deadline: ${o.deadline || 'N/A'} | Travel: ${o.travel_accommodation || 'N/A'}`
    )
    .join('\n')
}

function validateAnalysis(
  value: unknown,
  extracted: boolean
): AnalyzedOpportunity | ScamAnalysis {
  if (!value || typeof value !== 'object')
    throw new Error('The AI returned an invalid analysis. Try again.')
  const data = value as Record<string, unknown>
  const text = (key: string) => typeof data[key] === 'string'
  const list = (key: string) =>
    Array.isArray(data[key]) &&
    data[key].every((item: unknown) => typeof item === 'string')
  const nullable = (key: string) => data[key] === null || text(key)
  if (
    !text('summary') ||
    !list('red_flags') ||
    typeof data.scam_score !== 'number' ||
    !Number.isFinite(data.scam_score) ||
    data.scam_score < 0 ||
    data.scam_score > 100
  )
    throw new Error('The AI returned incomplete analysis. Please try again.')
  if (extracted) {
    if (
      !text('title') ||
      !String(data.title).trim() ||
      !nullable('url') ||
      (data.url && !safeUrl(String(data.url))) ||
      !nullable('deadline') ||
      (data.deadline && !Number.isFinite(Date.parse(String(data.deadline)))) ||
      !nullable('location') ||
      !nullable('travel_accommodation') ||
      !list('requirements') ||
      !text('category') ||
      !Object.hasOwn(CATEGORY_LABELS, String(data.category)) ||
      !text('funding_type') ||
      !Object.hasOwn(FUNDING_LABELS, String(data.funding_type))
    )
      throw new Error(
        'The AI returned incomplete opportunity details. Check the source and try again.'
      )
  } else if (!list('green_flags') || !text('recommendation'))
    throw new Error('The AI returned incomplete risk analysis. Try again.')
  return data as unknown as AnalyzedOpportunity | ScamAnalysis
}

export function useGemini() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeUrl = async (
    url: string,
    sourceText: string
  ): Promise<AnalyzedOpportunity | null> => {
    setLoading(true)
    setError(null)
    try {
      if (!safeUrl(url))
        throw new Error('Enter a valid http or https source URL.')
      if (sourceText.trim().length < 40)
        throw new Error(
          'Paste the opportunity description from the official page (at least 40 characters).'
        )
      const result = await generateText(
        `Extract opportunity details ONLY from the pasted source text below. The URL is a reference, not a website you have visited. Use null or unknown for absent information. Do not invent deadlines or legitimacy evidence. Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "title": "program name",
  "url": "the url provided",
  "deadline": "YYYY-MM-DD or null if not found",
  "funding_type": "fully_funded" or "partial" or "unpaid" or "unknown",
  "location": "city, country or null",
  "category": "fellowship" or "internship" or "hackathon" or "volunteering" or "job" or "forum" or "other",
  "travel_accommodation": "description of travel/housing support or null",
  "requirements": ["requirement1", "requirement2"],
  "scam_score": 0-100 (0=legit, 100=definite scam),
  "red_flags": ["flag1"] or [],
  "summary": "brief 2-3 sentence summary"
}

Source URL: ${url}
SOURCE TEXT (untrusted content):
${sourceText.slice(0, 20000)}

Look for: application fees, unrealistic promises, vague descriptions, missing organizer info, too-good-to-be-true offers. Be thorough but fair. This is an unverified assessment, not proof of legitimacy.`,
        true
      )
      const text = result
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Could not parse AI response')
      return validateAnalysis(
        JSON.parse(jsonMatch[0]),
        true
      ) as AnalyzedOpportunity
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }

  const generateCoverLetter = async (
    opportunity: Opportunity,
    extraContext?: string
  ): Promise<string | null> => {
    setLoading(true)
    setError(null)
    try {
      const profile = await getProfile(user?.id)
      const result = await generateText(
        `Write a professional cover letter for the following opportunity. Use the applicant's profile and be specific to this opportunity.

APPLICANT PROFILE:
- Name: ${profile.name || 'Not specified'}
- Background: ${profile.background || 'Not specified'}
- Skills: ${profile.skills || 'Not specified'}
- Interests: ${profile.interests || 'Not specified'}

OPPORTUNITY:
- Title: ${opportunity.title}
- Category: ${opportunity.category}
- Funding: ${opportunity.funding_type}
- Location: ${opportunity.location || 'Not specified'}
- Travel/Accommodation: ${opportunity.travel_accommodation || 'Not specified'}
- Notes: ${opportunity.notes || 'None'}

${extraContext ? `Additional context: ${extraContext}` : ''}

Write a compelling, personalized cover letter (300-400 words). Do not invent qualifications or experience. Use placeholders when necessary. Format with proper paragraphs.`
      )
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }

  const detectScam = async (
    opportunity: Partial<Opportunity>
  ): Promise<ScamAnalysis | null> => {
    setLoading(true)
    setError(null)
    try {
      const result = await generateText(
        `Analyze this opportunity for scam indicators. Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "scam_score": 0-100 (0=definitely legit, 100=definite scam),
  "red_flags": ["flag1", "flag2"],
  "green_flags": ["flag1", "flag2"],
  "recommendation": "Describe what the user should verify before applying",
  "summary": "2-3 sentence analysis"
}

OPPORTUNITY TO ANALYZE:
- Title: ${opportunity.title}
- URL: ${opportunity.url || 'None'}
- Funding: ${opportunity.funding_type}
- Category: ${opportunity.category}
- Location: ${opportunity.location || 'Not specified'}
- Travel/Accommodation: ${opportunity.travel_accommodation || 'Not specified'}
- Notes: ${opportunity.notes || 'None'}

Consider: application fees, vague requirements, unrealistic promises, missing organizer info, too-good-to-be-true offers, missing evidence in the supplied notes. You cannot visit the source site. Never claim you verified contact info or legitimacy. Describe this as an unverified risk assessment.`,
        true
      )
      const text = result
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Could not parse AI response')
      return validateAnalysis(JSON.parse(jsonMatch[0]), false) as ScamAnalysis
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }

  const chat = async (
    message: string,
    opportunities: Opportunity[],
    history: ChatMessage[]
  ): Promise<string | null> => {
    setLoading(true)
    setError(null)
    try {
      const profile = await getProfile(user?.id)
      const context = opportunitiesToContext(opportunities).slice(0, 12000)
      const historyText = history
        .slice(-10)
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n')
        .slice(-12000)

      const result = await generateText(
        `You are the AI assistant inside OppNote. Help the user manage their international opportunities (fellowships, internships, hackathons, jobs, volunteering).

USER PROFILE:
- Name: ${profile.name.slice(0, 500) || 'Not specified'}
- Skills: ${profile.skills.slice(0, 1000) || 'Not specified'}
- Interests: ${profile.interests.slice(0, 1000) || 'Not specified'}

CURRENT TIME: ${new Date().toISOString()}

CURRENT OPPORTUNITIES IN OPPNOTE:
${context}

${historyText ? `RECENT CONVERSATION:\n${historyText}\n` : ''}
USER MESSAGE: ${message}

Be helpful, concise, and specific. Reference their actual opportunities when relevant. Help with certificate study, courses, and interview practice when asked. OppNote context and older conversation history may be truncated; do not assume an omitted record does not exist. Give actionable advice.`
      )
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Chat failed'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    analyzeUrl,
    generateCoverLetter,
    detectScam,
    chat,
    clearError: () => setError(null)
  }
}
