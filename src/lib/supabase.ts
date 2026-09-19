import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    /^https?:\/\//.test(supabaseUrl) &&
    supabaseAnonKey &&
    !supabaseUrl.includes('placeholder')
)

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://not-configured.invalid',
  supabaseAnonKey || 'not-configured',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)
