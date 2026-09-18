import { isSupabaseConfigured } from './lib/supabase'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import OpportunitiesList from './pages/OpportunitiesList'
import OpportunityForm from './pages/OpportunityForm'
import OpportunityDetail from './pages/OpportunityDetail'
import ScamList from './pages/ScamList'
import { lazy, Suspense } from 'react'
const AiAssistant = lazy(() => import('./pages/AiAssistant'))
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import AuthCallback from './pages/auth/AuthCallback'

export default function App() {
  if (!isSupabaseConfigured)
    return (
      <main className="main-shell">
        <div className="paper-panel">
          <h1>Connect your notebook.</h1>
          <p className="subtitle">
            Configure the Supabase URL and public key to open OppTracker.
          </p>
        </div>
      </main>
    )
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
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
            <Route
              path="/opportunities/:id/edit"
              element={<OpportunityForm />}
            />
            <Route path="/opportunities/:id" element={<OpportunityDetail />} />
            <Route path="/scam-list" element={<ScamList />} />
            <Route
              path="*"
              element={
                <div className="paper-panel">
                  <h1>Page not found</h1>
                  <Link className="text-link" to="/">
                    Back to your desk
                  </Link>
                </div>
              }
            />
            <Route
              path="/ai-assistant"
              element={
                <Suspense
                  fallback={<p role="status">Opening your assistant…</p>}
                >
                  <AiAssistant />
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
