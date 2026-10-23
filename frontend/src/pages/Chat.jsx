import { useAuth } from '../context/useAuth'

export default function Chat() {
  const { user, logout } = useAuth()

  return (
    <div style={{ maxWidth: 600, margin: '40px auto' }}>
      <h1>Hello, {user.name}</h1>
      <button onClick={logout}>Log out</button>
      <p>The global chat goes here in Phase 8.</p>
    </div>
  )
}