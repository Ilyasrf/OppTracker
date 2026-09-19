import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import AuthLayout, { PasswordField } from '../../components/Auth/AuthLayout'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { signUp, user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match. Check both fields and try again.')
      return
    }
    if (password.length < 6) {
      setError('Use a password with at least 6 characters.')
      return
    }
    setBusy(true)
    const result = await signUp(email.trim(), password)
    if (result.error) {
      setError(result.error)
      setBusy(false)
    } else if (!result.signedIn)
      navigate('/login', {
        replace: true,
        state: {
          from: location.state?.from,
          message:
            'Account request received. Check your inbox if email confirmation is required, then sign in.'
        }
      })
  }

  // Login owns return-path validation and sends active sessions straight to their destination.
  if (!loading && user)
    return (
      <Navigate to="/login" state={{ from: location.state?.from }} replace />
    )
  return (
    <AuthLayout
      title="Start your notebook."
      subtitle="Give your applications and preparation a place of their own."
    >
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
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
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
            id="signup-password"
            newPassword
            value={password}
            onChange={setPassword}
          />
          <PasswordField
            id="confirm-password"
            label="Confirm password"
            newPassword
            value={confirmPassword}
            onChange={setConfirmPassword}
          />
          <button type="submit" className="button primary w-full">
            {busy
              ? 'Creating your account…'
              : loading
                ? 'Checking your session…'
                : 'Create account ↗'}
          </button>
        </fieldset>
        <p className="auth-switch">
          Already have an account?{' '}
          <Link
            to="/login"
            state={{ from: location.state?.from }}
            className="text-link"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
