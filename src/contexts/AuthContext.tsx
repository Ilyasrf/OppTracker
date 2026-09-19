import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOutWarning: string
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error?: string; signedIn?: boolean }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [signOutWarning, setSignOutWarning] = useState('')

  useEffect(() => {
    let active = true
    let authChanged = false
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!active || authChanged) return
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      })
      .catch(() => {
        if (!active || authChanged) return
        setSession(null)
        setUser(null)
        setLoading(false)
      })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      authChanged = true
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    setSignOutWarning('')
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      return error
        ? { error: error.message }
        : { signedIn: Boolean(data.session) }
    } catch {
      return { error: 'Could not connect. Please try again.' }
    }
  }

  const signIn = async (email: string, password: string) => {
    setSignOutWarning('')
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      return error ? { error: error.message } : {}
    } catch {
      return { error: 'Could not connect. Please try again.' }
    }
  }

  const signOut = async () => {
    setSignOutWarning('')
    const { error } = await supabase.auth.signOut()
    if (error) {
      // Supabase can remove the local session even when remote revocation fails.
      const { data } = await supabase.auth.getSession()
      if (!data.session)
        setSignOutWarning(
          'You are signed out on this device, but sign-out on other devices could not be confirmed. Sign in again to retry.'
        )
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signOutWarning,
        signUp,
        signIn,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
