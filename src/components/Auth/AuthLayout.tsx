import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

export default function AuthLayout({
  title,
  subtitle,
  children
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="auth-shell">
      <header className="auth-header">
        <Link className="brand" to="/" aria-label="OppNote home">
          <span className="brand-mark" aria-hidden="true">
            ↗
          </span>
          opp<span className="font-normal">note</span>
          <span className="brand-dot" />
        </Link>
        <span className="handwritten">A little more organized.</span>
      </header>
      <main className="auth-main">
        <section className="auth-intro" aria-labelledby="auth-intro-title">
          <p className="eyebrow">Your opportunity notebook</p>
          <h1 id="auth-intro-title">
            Keep your next step <span className="marked">in sight.</span>
          </h1>
          <p className="subtitle">
            A place for the applications you care about—and the preparation that
            gets you there.
          </p>
          <div className="focus-card auth-note">
            <p className="handwritten">A page for every possibility.</p>
            <ul>
              <li>
                <span aria-hidden="true">↗</span>
                <div>
                  <strong>Apply with a plan</strong>
                  <p>Keep opportunities, deadlines, and follow-ups together.</p>
                </div>
              </li>
              <li>
                <span aria-hidden="true">✓</span>
                <div>
                  <strong>Prepare a little each day</strong>
                  <p>
                    Build a path through certificates, interviews, and courses.
                  </p>
                </div>
              </li>
              <li>
                <span aria-hidden="true">✎</span>
                <div>
                  <strong>Pick up the conversation</strong>
                  <p>Return to your saved ideas and AI conversations.</p>
                </div>
              </li>
            </ul>
          </div>
        </section>
        <section
          className="paper-panel auth-panel"
          aria-labelledby="auth-form-title"
        >
          <p className="eyebrow">OppNote / your space</p>
          <h2 id="auth-form-title">{title}</h2>
          <p className="subtitle">{subtitle}</p>
          {children}
        </section>
      </main>
      <footer className="auth-footer">
        <span>Opportunities. Preparation. Progress.</span>
        <span className="handwritten">make room for what’s next ↗</span>
      </footer>
    </div>
  )
}

export function PasswordField({
  id,
  label = 'Password',
  value,
  onChange,
  newPassword = false
}: {
  id: string
  label?: string
  value: string
  onChange: (value: string) => void
  newPassword?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <div className="auth-password">
        <input
          id={id}
          name={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={newPassword ? 'new-password' : 'current-password'}
          required
          minLength={newPassword ? 6 : undefined}
          aria-describedby={newPassword ? `${id}-hint` : undefined}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-pressed={show}
          aria-controls={id}
          aria-label={`${show ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
      {newPassword && (
        <span id={`${id}-hint`} className="field-hint">
          Use at least 6 characters, or more if your account policy requires it.
        </span>
      )}
    </div>
  )
}
