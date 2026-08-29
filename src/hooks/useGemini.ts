import { useState } from 'react'
import { geminiModel } from '../lib/gemini'
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
  if (!userId) return { name: '', email: '', skills: '', background: '', interests: '' }
  
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (data) {
    return {
      name: data.name || '',
      email: data.email || '',
      skills: data.skills || '',
      background: data.background || '',
      interests: data.interests || '',
    }
  }
  return { name: '', email: '', skills: '', background: '', interests: '' }
}

export async function saveProfile(userId: string | undefined, profile: UserProfile) {
  if (!userId) return
  await supabase
    .from('profiles')
    .upsert({ id: userId, ...profile })
}

function opportunitiesToContext(opportunities: Opportunity[]): string {
  if (opportunities.length === 0) return 'No opportunities in tracker yet.'
  return opportunities.map(o =>
    `- ${o.title} | Status: ${o.status} | Funding: ${o.funding_type} | Category: ${o.category} | Location: ${o.location || 'N/A'} | Deadline: ${o.deadline || 'N/A'} | Travel: ${o.travel_accommodation || 'N/A'}`
  ).join('\n')
}

export function useGemini() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeUrl = async (url: string): Promise<AnalyzedOpportunity | null> => {
    setLoading(true)
    setError(null)
    try {
      const result = await geminiModel.generateContent(
        `Analyze this opportunity URL and extract all available information. Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
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

URL to analyze: ${url}

Look for: application fees, unrealistic promises, vague descriptions, missing organizer info, too-good-to-be-true offers. Be thorough but fair.`
      )
      const text = result.response.text()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Could not parse AI response')
      return JSON.parse(jsonMatch[0]) as AnalyzedOpportunity
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
      const result = await geminiModel.generateContent(
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

Write a compelling, personalized cover letter (300-400 words). Be genuine, not generic. Format with proper paragraphs.`
      )
      return result.response.text()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }

  const detectScam = async (opportunity: Partial<Opportunity>): Promise<ScamAnalysis | null> => {
    setLoading(true)
    setError(null)
    try {
      const result = await geminiModel.generateContent(
        `Analyze this opportunity for scam indicators. Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "scam_score": 0-100 (0=definitely legit, 100=definite scam),
  "red_flags": ["flag1", "flag2"],
  "green_flags": ["flag1", "flag2"],
  "recommendation": "Apply with confidence" or "Proceed with caution" or "Do not apply",
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

Consider: application fees, vague requirements, unrealistic promises, missing organizer info, too-good-to-be-true offers, poor grammar on source site, no verifiable contact info.`
      )
      const text = result.response.text()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Could not parse AI response')
      return JSON.parse(jsonMatch[0]) as ScamAnalysis
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
      const context = opportunitiesToContext(opportunities)
      const historyText = history.slice(-10).map(m =>
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n')

      const result = await geminiModel.generateContent(
        `You are an AI assistant for an opportunity tracker app. Help the user manage their international opportunities (fellowships, internships, hackathons, jobs, volunteering).

USER PROFILE:
- Name: ${profile.name || 'Not specified'}
- Skills: ${profile.skills || 'Not specified'}
- Interests: ${profile.interests || 'Not specified'}

CURRENT OPPORTUNITIES IN TRACKER:
${context}

${historyText ? `RECENT CONVERSATION:\n${historyText}\n` : ''}
USER MESSAGE: ${message}

Be helpful, concise, and specific. Reference their actual opportunities when relevant. Give actionable advice.`
      )
      return result.response.text()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Chat failed'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, analyzeUrl, generateCoverLetter, detectScam, chat }
}
