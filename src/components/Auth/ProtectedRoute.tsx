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
