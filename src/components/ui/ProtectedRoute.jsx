// src/components/ui/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.jsx'

export default function ProtectedRoute({ children, requiredRole }) {
  const { currentUser, loading, isSuperAdmin, isOfficeAdmin } = useAuth()

  // Still restoring session from stored token — show nothing yet
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8faf9' }}>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto"
            style={{ background: '#0B4E3D', color: 'white' }}>🎓</div>
          <div className="text-sm text-gray-400">Loading...</div>
        </div>
      </div>
    )
  }

  if (!currentUser) return <Navigate to="/admin/login" replace />

  if (requiredRole === 'superadmin' && !isSuperAdmin) return <Navigate to="/admin" replace />
  if (requiredRole === 'office_admin' && !isOfficeAdmin) return <Navigate to="/admin" replace />

  return children
}