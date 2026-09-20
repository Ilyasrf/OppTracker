import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import AuthLayout, { PasswordField } from '../../components/Auth/AuthLayout'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { signIn, user, loading, signOutWarning } = useAuth()
  const location = useLocation()
  const from = location.state?.from
  // Only return to local application pages; never follow a supplied external URL.
  const destination =
    typeof from === 'string' &&
    /^\/(?![/\\])/.test(from) &&
    !from.includes('\\') &&
    !/^\/(login|signup|auth)([/?#]|$)/.test(from)
      ? from
      : '/'

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    setError('')
    setBusy(true)
    const result = await signIn(email.trim(), password)
    if (result.error) setError(result.error)
    setBusy(false)
  }

  if (!loading && user) return <Navigate to={destination} replace />
  return (
    <AuthLayout
      title="Welcome back."
      subtitle="Sign in and pick up where you left off."
    >
      {signOutWarning && (
        <p role="alert" className="error-notice mt-5">
          {signOutWarning}
        </p>
      )}
      {typeof location.state?.message === 'string' && (
        <p role="status" className="success-notice mt-5">
          {location.state.message}
        </p>
      )}
      {typeof location.state?.error === 'string' && (
        <p role="alert" className="error-notice mt-5">
          {location.state.error}
        </p>
      )}
      <form
        onSubmit={handleSubmit}
        className="auth-form"
        aria-busy={busy || loading}
      >
        {error && (
          <p role="alert" className="error-notice">
            {error}
          </p>
        )}
        <fieldset disabled={busy || loading}>
          <div>
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <PasswordField
            id="login-password"
            value={password}
            onChange={setPassword}
          />
          <button type="submit" className="button primary w-full">
            {busy
              ? 'Signing in…'
              : loading
                ? 'Checking your session…'
                : 'Sign in ↗'}
          </button>
        </fieldset>
        <p className="auth-switch">
          New to OppNote?{' '}
          <Link
            to="/signup"
            state={{ from: destination }}
            className="text-link"
          >
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
