import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Opportunity } from '../lib/types'

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOpportunities = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .order('deadline', { ascending: true })
    
    if (error) setError(error.message)
    else {
      setOpportunities(data || [])
      setError(null)
    }
    setLoading(false)
  }, [])

  const addOpportunity = async (opp: Omit<Opportunity, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('opportunities')
      .insert(opp)
      .select()
      .single()
    
    if (error) throw error
    setOpportunities(prev => [...prev, data])
    return data
  }

  const updateOpportunity = async (id: string, updates: Partial<Opportunity>) => {
    const { data, error } = await supabase
      .from('opportunities')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    setOpportunities(prev => prev.map(o => o.id === id ? data : o))
    return data
  }

  const deleteOpportunity = async (id: string) => {
    const { error } = await supabase
      .from('opportunities')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    setOpportunities(prev => prev.filter(o => o.id !== id))
  }

  useEffect(() => { fetchOpportunities() }, [fetchOpportunities])

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
