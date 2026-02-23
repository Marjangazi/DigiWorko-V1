import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowIncomplete }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-flex">
            <div className="w-16 h-16 rounded-full border-4 border-primary-500/30 border-t-primary-500 animate-spin" />
          </div>
          <p className="mt-4 text-dark-500 text-sm font-medium tracking-widest uppercase">
            Loading...
          </p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!allowIncomplete && profile && !profile.whatsapp) {
    return <Navigate to="/complete-profile" state={{ from: location }} replace />
  }

  return children
}
