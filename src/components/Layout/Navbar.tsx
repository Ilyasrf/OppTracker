import { Link, useLocation } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/opportunities', label: 'Opportunities' },
  { to: '/scam-list', label: 'Scam List' },
]

export default function Navbar() {
  const location = useLocation()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-dark-border bg-dark/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-accent/20 text-accent">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span className="font-mono text-lg font-bold text-white">OppTracker</span>
            </Link>
            <div className="hidden md:flex md:gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    (link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to))
                      ? 'bg-accent/10 text-accent'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <Link
            to="/opportunities/new"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-all hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Opportunity
          </Link>
        </div>
      </div>
    </nav>
  )
}
