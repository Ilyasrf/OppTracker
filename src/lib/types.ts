export type OpportunityStatus = 
  | 'need_to_apply' 
  | 'applied' 
  | 'under_review' 
  | 'interview' 
  | 'accepted' 
  | 'rejected' 
  | 'scam'

export type FundingType = 'fully_funded' | 'partial' | 'unpaid' | 'unknown'

export type Category = 'fellowship' | 'internship' | 'hackathon' | 'volunteering' | 'other'

export interface Opportunity {
  id: string
  user_id: string
  title: string
  url: string | null
  deadline: string | null
  status: OpportunityStatus
  funding_type: FundingType
  location: string | null
  travel_accommodation: string | null
  category: Category
  notes: string | null
  created_at: string
  updated_at: string
}

export const STATUS_LABELS: Record<OpportunityStatus, string> = {
  need_to_apply: 'Need to Apply',
  applied: 'Applied',
  under_review: 'Under Review',
  interview: 'Interview',
  accepted: 'Accepted',
  rejected: 'Rejected',
  scam: 'Scam',
}

export const STATUS_COLORS: Record<OpportunityStatus, string> = {
  need_to_apply: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  applied: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  under_review: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  interview: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  accepted: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  scam: 'bg-red-600/20 text-red-300 border-red-600/30',
}

export const FUNDING_LABELS: Record<FundingType, string> = {
  fully_funded: 'Fully Funded',
  partial: 'Partial Funding',
  unpaid: 'Unpaid',
  unknown: 'Unknown',
}

export const CATEGORY_LABELS: Record<Category, string> = {
  fellowship: 'Fellowship',
  internship: 'Internship',
  hackathon: 'Hackathon',
  volunteering: 'Volunteering',
  other: 'Other',
}
