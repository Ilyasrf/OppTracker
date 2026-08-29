# Email Authentication & Multi-User Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase email authentication with signup, login, email verification, and per-user data isolation so multiple users can independently track opportunities.

**Architecture:** Wrap the app in an AuthProvider that listens to Supabase auth state changes. Create login/signup pages. Protect all routes with a ProtectedRoute wrapper. Update the database schema to use `auth.users` UUIDs for `user_id` and rewrite RLS policies to enforce per-user data isolation. Update all CRUD hooks to scope queries by the authenticated user's ID.

**Tech Stack:** Supabase Auth (email/password), React Context, React Router, existing Supabase JS client

---

## File Structure

| Action | File | Purpose |
|--------|------|---------|
| Modify | `src/lib/supabase.ts` | Add auth configuration to Supabase client |
| Create | `src/contexts/AuthContext.tsx` | AuthProvider + useAuth hook (session, user, loading) |
| Create | `src/components/Auth/ProtectedRoute.tsx` | Route guard redirecting unauthenticated users |
| Create | `src/pages/auth/LoginPage.tsx` | Email/password login form |
| Create | `src/pages/auth/SignupPage.tsx` | Email/password signup form |
| Create | `src/pages/auth/VerifyPage.tsx` | "Check your email" confirmation page |
| Create | `src/pages/auth/AuthCallback.tsx` | Handle Supabase email confirmation redirect |
| Modify | `src/App.tsx` | Wrap in AuthProvider, add auth routes, protect app routes |
| Modify | `src/components/Layout/Navbar.tsx` | Add user email display + sign out button |
| Modify | `src/lib/types.ts` | Update Opportunity type (user_id is now UUID) |
| Modify | `src/hooks/useOpportunities.ts` | Scope all queries by authenticated user_id |
| Modify | `supabase/schema.sql` | Change user_id to UUID FK, rewrite RLS policies |
| Modify | `src/hooks/useGemini.ts` | Move user profile from localStorage to Supabase |
| Modify | `src/index.css` | Add auth page styles |

---

## Global Constraints

- React 19.2.8, TypeScript 6.0, Vite 8.2.0
- Supabase JS client (already installed)
- Tailwind CSS 4.3.3 for all styling (match existing dark theme)
- No new dependencies — use only what's already in package.json
- All auth state managed via React Context (no external state library)
- Email verification required before app access
- Existing opportunities migrated to first signed-up user

---

### Task 1: Update Supabase Client Config

**Files:**
- Modify: `src/lib/supabase.ts`

**Interfaces:**
- Produces: `supabase` client with auth session persistence enabled

- [ ] **Step 1: Update supabase.ts with auth options**

Replace the entire content of `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn(
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  )
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
```

- [ ] **Step 2: Verify the app still builds**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase.ts
git commit -m "feat: enable Supabase auth session persistence"
```

---

### Task 2: Create Auth Context and Provider

**Files:**
- Create: `src/contexts/AuthContext.tsx`

**Interfaces:**
- Produces: `AuthProvider` component, `useAuth()` hook returning `{ user, session, loading, signUp, signIn, signOut }`

- [ ] **Step 1: Create the AuthContext**

Create `src/contexts/AuthContext.tsx`:

```typescript
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }
    return {}
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return {}
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
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
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/contexts/AuthContext.tsx
git commit -m "feat: add AuthProvider with Supabase auth state management"
```

---

### Task 3: Create ProtectedRoute Component

**Files:**
- Create: `src/components/Auth/ProtectedRoute.tsx`

**Interfaces:**
- Consumes: `useAuth()` from AuthContext
- Produces: `ProtectedRoute` wrapper component

- [ ] **Step 1: Create ProtectedRoute**

Create `src/components/Auth/ProtectedRoute.tsx`:

```typescript
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark">
        <div className="text-accent text-xl font-mono">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/Auth/ProtectedRoute.tsx
git commit -m "feat: add ProtectedRoute component for auth guard"
```

---

### Task 4: Create Auth Pages (Login, Signup, Verify, Callback)

**Files:**
- Create: `src/pages/auth/LoginPage.tsx`
- Create: `src/pages/auth/SignupPage.tsx`
- Create: `src/pages/auth/VerifyPage.tsx`
- Create: `src/pages/auth/AuthCallback.tsx`

**Interfaces:**
- Consumes: `useAuth()` from AuthContext
- Produces: Four page components for the auth flow

- [ ] **Step 1: Create LoginPage**

Create `src/pages/auth/LoginPage.tsx`:

```typescript
import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn(email, password)
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-mono text-3xl font-bold text-accent">OppTracker</h1>
          <p className="mt-2 text-gray-400">Sign in to track your opportunities</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-dark-border bg-dark-card p-8 backdrop-blur-sm">
          {error && (
            <div className="rounded-lg bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-gray-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-dark-border bg-dark px-4 py-3 text-white placeholder-gray-500 focus:border-accent focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-dark-border bg-dark px-4 py-3 text-white placeholder-gray-500 focus:border-accent focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent py-3 font-medium text-white transition hover:bg-accent/80 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-accent hover:underline">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create SignupPage**

Create `src/pages/auth/SignupPage.tsx`:

```typescript
import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const result = await signUp(email, password)
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      navigate('/verify')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-mono text-3xl font-bold text-accent">OppTracker</h1>
          <p className="mt-2 text-gray-400">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-dark-border bg-dark-card p-8 backdrop-blur-sm">
          {error && (
            <div className="rounded-lg bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-gray-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-dark-border bg-dark px-4 py-3 text-white placeholder-gray-500 focus:border-accent focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-dark-border bg-dark px-4 py-3 text-white placeholder-gray-500 focus:border-accent focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-dark-border bg-dark px-4 py-3 text-white placeholder-gray-500 focus:border-accent focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent py-3 font-medium text-white transition hover:bg-accent/80 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>

          <p className="text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create VerifyPage**

Create `src/pages/auth/VerifyPage.tsx`:

```typescript
import { Link } from 'react-router-dom'

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-dark px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <h1 className="font-mono text-3xl font-bold text-accent">OppTracker</h1>
        </div>

        <div className="rounded-xl border border-dark-border bg-dark-card p-8 backdrop-blur-sm">
          <div className="mb-4 text-5xl">📧</div>
          <h2 className="mb-2 text-xl font-semibold text-white">Check your email</h2>
          <p className="mb-6 text-gray-400">
            We've sent a confirmation link to your email address.
            Click the link to verify your account and start tracking opportunities.
          </p>
          <Link
            to="/login"
            className="inline-block rounded-lg bg-accent px-6 py-3 font-medium text-white transition hover:bg-accent/80"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create AuthCallback**

Create `src/pages/auth/AuthCallback.tsx`:

```typescript
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/')
      } else {
        navigate('/login')
      }
    })
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark">
      <div className="text-accent text-xl font-mono">Verifying...</div>
    </div>
  )
}
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add src/pages/auth/
git commit -m "feat: add auth pages (login, signup, verify, callback)"
```

---

### Task 5: Update App.tsx with AuthProvider and Protected Routes

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `AuthProvider`, `ProtectedRoute`, auth page components
- Produces: Updated router with auth flow

- [ ] **Step 1: Rewrite App.tsx**

Replace the entire content of `src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import OpportunitiesList from './pages/OpportunitiesList'
import OpportunityForm from './pages/OpportunityForm'
import OpportunityDetail from './pages/OpportunityDetail'
import ScamList from './pages/ScamList'
import AiAssistant from './pages/AiAssistant'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import VerifyPage from './pages/auth/VerifyPage'
import AuthCallback from './pages/auth/AuthCallback'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/opportunities" element={<OpportunitiesList />} />
            <Route path="/opportunities/new" element={<OpportunityForm />} />
            <Route path="/opportunities/:id/edit" element={<OpportunityForm />} />
            <Route path="/opportunities/:id" element={<OpportunityDetail />} />
            <Route path="/scam-list" element={<ScamList />} />
            <Route path="/ai-assistant" element={<AiAssistant />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wrap app in AuthProvider, add auth routes, protect app routes"
```

---

### Task 6: Update Navbar with User Info and Sign Out

**Files:**
- Modify: `src/components/Layout/Navbar.tsx`

**Interfaces:**
- Consumes: `useAuth()` from AuthContext
- Produces: Updated navbar with user email and sign out button

- [ ] **Step 1: Rewrite Navbar.tsx**

Replace the entire content of `src/components/Layout/Navbar.tsx`:

```typescript
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/opportunities', label: 'Opportunities' },
  { to: '/ai-assistant', label: 'AI Assistant' },
]

export default function Navbar() {
  const location = useLocation()
  const { user, signOut } = useAuth()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-dark-border bg-dark/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <svg className="h-8 w-8 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="font-mono text-xl font-bold text-white">OppTracker</span>
          </Link>
          <div className="hidden md:flex md:gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  location.pathname === link.to
                    ? 'bg-accent/10 text-accent'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-gray-400 sm:block">{user?.email}</span>
          <button
            onClick={signOut}
            className="rounded-lg border border-dark-border px-3 py-2 text-sm text-gray-400 transition hover:border-accent-red hover:text-accent-red"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/Layout/Navbar.tsx
git commit -m "feat: add user email display and sign out button to navbar"
```

---

### Task 7: Update Database Schema for Multi-User

**Files:**
- Modify: `supabase/schema.sql`

**Interfaces:**
- Produces: Updated SQL schema with UUID user_id, per-user RLS policies, migration for existing data

- [ ] **Step 1: Rewrite schema.sql**

Replace the entire content of `supabase/schema.sql`:

```sql
-- Drop existing policies and trigger
DROP POLICY IF EXISTS "Allow all operations" ON opportunities;
DROP TRIGGER IF EXISTS opportunities_updated_at ON opportunities;
DROP FUNCTION IF EXISTS update_updated_at();

-- Recreate the table with proper user_id
-- IMPORTANT: Run the migration script first to preserve existing data
-- See migrations/001_add_auth.sql

DROP TABLE IF EXISTS opportunities;

CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'need_to_apply' CHECK (status IN ('need_to_apply','applied','under_review','interview','accepted','rejected','scam')),
  funding_type TEXT DEFAULT 'unknown' CHECK (funding_type IN ('fully_funded','partial','unpaid','unknown')),
  location TEXT,
  travel_accommodation TEXT,
  category TEXT DEFAULT 'other' CHECK (category IN ('fellowship','internship','hackathon','volunteering','job','forum','other')),
  notes TEXT,
  applied_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Users can only read their own opportunities
CREATE POLICY "Users can read own opportunities"
  ON opportunities FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own opportunities
CREATE POLICY "Users can insert own opportunities"
  ON opportunities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own opportunities
CREATE POLICY "Users can update own opportunities"
  ON opportunities FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own opportunities
CREATE POLICY "Users can delete own opportunities"
  ON opportunities FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

- [ ] **Step 2: Create migration script**

Create `supabase/migrations/001_add_auth.sql`:

```sql
-- Migration: Add auth support to opportunities table
-- Run this BEFORE deploying the new schema.sql
-- This preserves existing data when switching from single-user to multi-user

-- Step 1: Create a temporary column with UUID type
ALTER TABLE opportunities ADD COLUMN user_id_new UUID;

-- Step 2: Enable Supabase Auth if not already enabled
-- (This is usually done in Supabase dashboard, but here's the SQL)
-- Note: You may need to run this via Supabase SQL editor

-- Step 3: For existing data, you have two options:
-- Option A: Assign all existing data to a specific user (run after first signup)
-- UPDATE opportunities SET user_id_new = '<your-user-id-here>' WHERE user_id = 'single-user';

-- Option B: Delete old data (if you want a fresh start)
-- DELETE FROM opportunities WHERE user_id = 'single-user';

-- Step 4: Drop old column and rename new one (run after Step 3)
-- ALTER TABLE opportunities DROP COLUMN user_id;
-- ALTER TABLE opportunities RENAME COLUMN user_id_new TO user_id;

-- Step 5: Make user_id NOT NULL and add foreign key
-- ALTER TABLE opportunities ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE opportunities ADD CONSTRAINT fk_user_id
--   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- NOTE: This migration is commented out because it requires manual execution
-- after the first user signs up. Follow these steps:
--
-- 1. Deploy the new code with auth pages
-- 2. Sign up as the first user
-- 3. Copy your user ID from Supabase dashboard (Authentication > Users)
-- 4. Uncomment and run Step 3 Option A with your user ID
-- 5. Uncomment and run Steps 4-5
-- 6. Drop the old user_id column: ALTER TABLE opportunities DROP COLUMN user_id;
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add supabase/schema.sql supabase/migrations/001_add_auth.sql
git commit -m "feat: update database schema for multi-user auth with RLS policies"
```

---

### Task 8: Update useOpportunities Hook for User Scoping

**Files:**
- Modify: `src/hooks/useOpportunities.ts`

**Interfaces:**
- Consumes: `useAuth()` from AuthContext
- Produces: CRUD operations scoped by authenticated user's ID

- [ ] **Step 1: Rewrite useOpportunities.ts**

Replace the entire content of `src/hooks/useOpportunities.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Opportunity } from '../lib/types'

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
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useOpportunities.ts
git commit -m "feat: scope all opportunity CRUD by authenticated user_id"
```

---

### Task 9: Move User Profile from localStorage to Supabase

**Files:**
- Modify: `src/hooks/useGemini.ts`
- Modify: `supabase/schema.sql` (append profiles table)
- Modify: `src/components/ai/CoverLetterGenerator.tsx`

**Interfaces:**
- Consumes: `useAuth()` from AuthContext
- Produces: User profile stored in Supabase `profiles` table

- [ ] **Step 1: Add profiles table to schema.sql**

Append to the end of `supabase/schema.sql`:

```sql
-- User profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  skills TEXT DEFAULT '',
  background TEXT DEFAULT '',
  interests TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

- [ ] **Step 2: Update useGemini.ts profile functions**

In `src/hooks/useGemini.ts`, replace the `getProfile` and `saveProfile` functions with Supabase-backed versions:

```typescript
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// Add to the hook:
const { user } = useAuth()

// Replace getProfile:
const getProfile = async () => {
  if (!user) return { name: '', email: '', skills: '', background: '', interests: '' }
  
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (data) {
    return {
      name: data.name || '',
      email: data.email || user.email || '',
      skills: data.skills || '',
      background: data.background || '',
      interests: data.interests || '',
    }
  }
  return { name: '', email: user.email || '', skills: '', background: '', interests: '' }
}

// Replace saveProfile:
const saveProfile = async (profile: { name: string; email: string; skills: string; background: string; interests: string }) => {
  if (!user) return
  await supabase
    .from('profiles')
    .upsert({ id: user.id, ...profile })
}
```

Since `getProfile` is now async, update all callers to use `await getProfile()`.

- [ ] **Step 3: Update CoverLetterGenerator.tsx**

In `src/components/ai/CoverLetterGenerator.tsx`, update profile loading:

```typescript
// Change from:
const [profile, setProfile] = useState(getProfile())

// To:
const [profile, setProfile] = useState({ name: '', email: '', skills: '', background: '', interests: '' })

useEffect(() => {
  getProfile().then(setProfile)
}, [])
```

Update the save handler to use async `saveProfile`.

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add supabase/schema.sql src/hooks/useGemini.ts src/components/ai/CoverLetterGenerator.tsx
git commit -m "feat: move user profile from localStorage to Supabase profiles table"
```

---

### Task 10: Data Migration (Manual Step)

**This task is manual and must be done after deployment and first signup.**

- [ ] **Step 1: Deploy the updated app**

Push to GitHub / deploy to Vercel. The app should now show login/signup pages.

- [ ] **Step 2: Sign up as the first user**

Create your account through the signup page. Verify your email.

- [ ] **Step 3: Get your user ID**

Go to Supabase Dashboard > Authentication > Users. Copy your user UUID.

- [ ] **Step 4: Run the migration**

Go to Supabase Dashboard > SQL Editor. Run:

```sql
-- Assign all existing opportunities to the first user
UPDATE opportunities SET user_id = '<your-user-uuid>' WHERE user_id = 'single-user';

-- Make user_id NOT NULL
ALTER TABLE opportunities ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE opportunities ADD CONSTRAINT fk_opportunities_user_id
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop the old text column default
ALTER TABLE opportunities ALTER COLUMN user_id DROP DEFAULT;
```

- [ ] **Step 5: Verify data**

Refresh the app. Your existing opportunities should appear with your account.

---

### Task 11: Update .env.example

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add auth-related comments**

Replace `.env.example` content:

```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Auth is handled automatically by Supabase Auth
# Enable Email provider in Supabase Dashboard > Authentication > Providers
# Set Site URL in Supabase Dashboard > Authentication > URL Configuration
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: update .env.example with auth configuration notes"
```

---

### Task 12: Final Verification

- [ ] **Step 1: Full build check**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Manual test flow**

1. Visit `/login` — should show login form
2. Visit `/signup` — should show signup form
3. Visit `/` without login — should redirect to `/login`
4. Sign up with email/password
5. Should redirect to `/verify` page
6. Check email, click confirmation link
7. Should redirect to `/` with dashboard showing (empty)
8. Add an opportunity — should appear in list
9. Sign out — should redirect to `/login`
10. Sign in again — opportunity should still be there
11. Try visiting `/opportunities` directly — should work (authenticated)

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete email authentication with multi-user support"
```
