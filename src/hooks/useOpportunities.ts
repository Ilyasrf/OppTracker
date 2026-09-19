import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  STATUS_LABELS,
  CATEGORY_LABELS,
  FUNDING_LABELS,
  type Opportunity
} from '../lib/types'
import { safeUrl } from '../lib/notifications'

export type OpportunityInput = Omit<
  Opportunity,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>

function validate(input: Partial<OpportunityInput>): string | null {
  if (
    input.title !== undefined &&
    (!input.title.trim() || input.title.length > 300)
  )
    return 'Use a title between 1 and 300 characters.'
  if (input.url && !safeUrl(input.url))
    return 'Use a valid http or https website link.'
  if (input.status !== undefined && !Object.hasOwn(STATUS_LABELS, input.status))
    return 'Choose a valid status.'
  if (
    input.category !== undefined &&
    !Object.hasOwn(CATEGORY_LABELS, input.category)
  )
    return 'Choose a valid category.'
  if (
    input.funding_type !== undefined &&
    !Object.hasOwn(FUNDING_LABELS, input.funding_type)
  )
    return 'Choose a valid funding type.'
  if (
    [input.deadline, input.applied_date].some(
      (d) => d && !Number.isFinite(Date.parse(d))
    )
  )
    return 'Enter a valid date and time.'
  if (input.notes && input.notes.length > 20000)
    return 'Keep notes under 20,000 characters.'
  return null
}

export function useOpportunities() {
  const { user } = useAuth()
  const userId = user?.id
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const version = useRef(0)

  const fetchOpportunities = useCallback(async () => {
    const request = ++version.current
    if (!userId) {
      setOpportunities([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const all: Opportunity[] = []
      // Read every page so backups cannot silently stop at Supabase's default row limit.
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase
          .from('opportunities')
          .select('*')
          .eq('user_id', userId)
          .order('id')
          .range(offset, offset + 499)
        if (error) throw error
        all.push(...(data || []))
        if (!data || data.length < 500) break
      }
      if (version.current !== request) return
      setOpportunities(all)
      setError(null)
    } catch {
      if (version.current === request)
        setError(
          'Could not load your opportunities. Check your connection and try again.'
        )
    } finally {
      if (version.current === request) setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    setOpportunities([])
    void fetchOpportunities()
    return () => {
      version.current++
    }
  }, [fetchOpportunities])

  const addOpportunity = async (input: OpportunityInput) => {
    if (!userId) return { error: 'Please sign in again.' }
    const invalid = validate(input)
    if (invalid) return { error: invalid }
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .insert({ ...input, title: input.title.trim(), user_id: userId })
        .select()
        .single()
      if (error) throw error
      setOpportunities((prev) => [...prev, data])
      return { data: data as Opportunity }
    } catch {
      return {
        error:
          'Could not save this opportunity. Your form is still here; please try again.'
      }
    }
  }

  const updateOpportunity = async (
    id: string,
    updates: Partial<OpportunityInput>
  ) => {
    if (!userId) return { error: 'Please sign in again.' }
    const invalid = validate(updates)
    if (invalid) return { error: invalid }
    const current = opportunities.find((o) => o.id === id)
    const changes = { ...updates }
    if (changes.title) changes.title = changes.title.trim()
    if (
      changes.status === 'applied' &&
      !current?.applied_date &&
      changes.applied_date === undefined
    )
      changes.applied_date = new Date().toISOString()
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .update(changes)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()
      if (error) throw error
      setOpportunities((prev) => prev.map((o) => (o.id === id ? data : o)))
      return { data: data as Opportunity }
    } catch {
      return { error: 'Could not save your changes. Please try again.' }
    }
  }

  const deleteOpportunity = async (id: string) => {
    if (!userId) return { error: 'Please sign in again.' }
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select('id')
        .single()
      if (error || !data) throw error || new Error('Not deleted')
      setOpportunities((prev) => prev.filter((o) => o.id !== id))
      return {}
    } catch {
      return { error: 'This opportunity was not deleted. Please try again.' }
    }
  }

  return {
    opportunities,
    loading,
    error,
    addOpportunity,
    updateOpportunity,
    deleteOpportunity,
    refetch: fetchOpportunities
  }
}
