import { useAuth } from '../context/useAuth'

export default function Chat() {
  const { user, logout } = useAuth()

  return (
    <div>
      <h1>Chat (real UI comes in Phase 8)</h1>
      <p>Logged in as {user.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}