import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Fragment } from 'react'

export default function ProtectedRoute({
  children
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark">
        <p role="status" className="handwritten text-3xl text-accent">
          Opening your notebook…
        </p>
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search + location.hash }}
        replace
      />
    )
  }

  // A cross-tab account switch must not carry private form/chat state forward.
  return <Fragment key={user.id}>{children}</Fragment>
}
