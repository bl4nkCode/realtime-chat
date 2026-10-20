import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../context/useAuth'

export default function GuestRoute() {
  const { user, loading } = useAuth()

  if (loading) return <p>Loading...</p>
  if (user) return <Navigate to="/" replace />

  return <Outlet />
}