import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../context/useAuth'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return <p>Loading...</p>
  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}