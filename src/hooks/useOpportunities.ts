import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Opportunity } from '../lib/types'

type OpportunityInput = Omit<Opportunity, 'id' | 'user_id' | 'created_at' | 'updated_at'>

export function useOpportunities() {
  const { user } = useAuth()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOpportunities = useCallback(async () => {
    if (!user) {
      setOpportunities([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('user_id', user.id)
      .order('deadline', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setOpportunities(data || [])
      setError(null)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchOpportunities()
  }, [fetchOpportunities])

  const addOpportunity = async (opp: OpportunityInput) => {
    if (!user) return { error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('opportunities')
      .insert({ ...opp, user_id: user.id })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    } else {
      setOpportunities((prev) => [...prev, data].sort((a, b) => {
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      }))
      return { data }
    }
  }

  const updateOpportunity = async (id: string, updates: Partial<OpportunityInput>) => {
    if (!user) return { error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('opportunities')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    } else {
      setOpportunities((prev) =>
        prev.map((o) => (o.id === id ? data : o))
      )
      return { data }
    }
  }

  const deleteOpportunity = async (id: string) => {
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
      .from('opportunities')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return { error: error.message }
    } else {
      setOpportunities((prev) => prev.filter((o) => o.id !== id))
      return {}
    }
  }

  return {
    opportunities,
    loading,
    error,
    addOpportunity,
    updateOpportunity,
    deleteOpportunity,
    refetch: fetchOpportunities,
  }
}
