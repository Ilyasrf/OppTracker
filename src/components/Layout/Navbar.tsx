import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useState } from 'react'

export default function Navbar() {
  const { signOut } = useAuth()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <header className="site-header">
      <div className="nav-shell">
        <NavLink to="/" className="brand" aria-label="OppTracker home">
          <span className="brand-mark" aria-hidden="true">
            ↗
          </span>
          opp<span className="font-normal">tracker</span>
          <span className="brand-dot" />
        </NavLink>
        <nav aria-label="Main navigation" className="nav-links">
          {[
            ['/', 'My desk'],
            ['/opportunities', 'Opportunities'],
            ['/preparation', 'Preparation'],
            ['/ai-assistant', 'AI assistant'],
            ['/scam-list', 'Flagged']
          ].map(([to, label]) => (
            <NavLink
              end={to === '/'}
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          className="sign-out"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            setError('')
            try {
              await signOut()
            } catch {
              setError('Sign out failed. Please try again.')
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? 'Signing out…' : 'Sign out'} ↗
        </button>
      </div>
      {error && (
        <p role="alert" className="error-notice">
          {error}
        </p>
      )}
    </header>
  )
}
