import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute({ children, roles }) {
  const { user, booting } = useAuth()
  const location = useLocation()

  if (booting) {
    return (
      <div className="zorvyn-canvas flex min-h-screen items-center justify-center text-zinc-500">
        Loading…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
