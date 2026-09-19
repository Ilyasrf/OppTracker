import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export interface NotebookRow {
  id: string
  user_id: string
  updated_at: string
}

function notebookError(error: { code?: string }, fallback: string) {
  if (error.code === '23505')
    return 'This item is already saved. Export your draft, then reload the saved version before continuing.'
  if (error.code === '23514')
    return 'A field is invalid or this notebook page is full. Export your draft before reloading or shortening it.'
  return ['42P01', 'PGRST205'].includes(error.code || '')
    ? 'This section needs the preparation and chat database update. Your existing opportunities are safe. Ask the app owner to run migration 002, then retry.'
    : fallback
}

// Both notebooks use owner-only rows and timestamp checks to avoid overwriting another tab.
export function useNotebook<T extends NotebookRow>(
  table: 'ai_conversations' | 'preparation_plans'
) {
  const { user } = useAuth()
  const [rows, setRows] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const generation = useRef(0)
  const refresh = useCallback(async () => {
    const request = ++generation.current
    setLoading(true)
    setError('')
    try {
      if (!user) {
        setRows([])
        return
      }
      const all: T[] = []
      // ponytail: load full personal notebooks; use summary queries if histories grow large.
      for (let offset = 0; ; offset += 100) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', user.id)
          .order('id')
          .range(offset, offset + 99)
        if (error)
          throw new Error(
            notebookError(error, 'Could not load your notebook. Please retry.')
          )
        all.push(...(data as T[]))
        if (data.length < 100) break
      }
      if (request === generation.current)
        setRows(all.sort((a, b) => b.updated_at.localeCompare(a.updated_at)))
    } catch (err) {
      if (request === generation.current)
        setError(
          err instanceof Error ? err.message : 'Could not load your notebook.'
        )
    } finally {
      if (request === generation.current) setLoading(false)
    }
  }, [table, user?.id])
  useEffect(() => {
    setRows([])
    void refresh()
    return () => {
      generation.current++
    }
  }, [refresh])

  async function save(row: T): Promise<T> {
    if (!user || row.user_id !== user.id)
      throw new Error('Please sign in again before saving.')
    const { updated_at, ...payload } = row
    const query = updated_at
      ? supabase
          .from(table)
          .update(payload as Record<string, unknown>)
          .eq('id', row.id)
          .eq('user_id', user.id)
          .eq('updated_at', updated_at)
      : supabase.from(table).insert(payload as Record<string, unknown>)
    const { data, error } = await query.select('*').maybeSingle()
    if (error)
      throw new Error(
        notebookError(
          error,
          'Could not save. Your draft is still here; retry when connected.'
        )
      )
    if (!data)
      throw new Error(
        'This item changed in another tab. Export your draft, then reload before editing again.'
      )
    const saved = data as T
    setRows((previous) => [
      saved,
      ...previous.filter((item) => item.id !== saved.id)
    ])
    return saved
  }
  return { rows, loading, error, refresh, save }
}
