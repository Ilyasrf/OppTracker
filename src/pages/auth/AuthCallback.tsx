import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function AuthCallback() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const query = new URLSearchParams(location.search)
  const hash = new URLSearchParams(location.hash.slice(1))
  const failed =
    query.has('error') ||
    query.has('error_code') ||
    hash.has('error') ||
    hash.has('error_code')
  if (loading)
    return (
      <main className="auth-loading">
        <p role="status" className="handwritten text-3xl">
          Opening your notebook…
        </p>
      </main>
    )
  if (failed || !user)
    return (
      <Navigate
        to="/login"
        replace
        state={{
          error:
            'This sign-in link could not be verified. It may have expired or already been used. Try signing in with your email and password.'
        }}
      />
    )
  return <Navigate to="/" replace />
}
