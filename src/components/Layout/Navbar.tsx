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
