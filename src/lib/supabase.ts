import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn(
    '⚠️ Supabase not configured. Create a .env file with your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n' +
    'See .env.example for the template.'
  )
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')
