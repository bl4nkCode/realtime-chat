import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import echo from '../lib/echo'
import { fetchMessages, sendMessage } from '../lib/messages'

// Combine two lists of messages without duplicates, ordered by id.
function mergeMessages(current, incoming) {
  const byId = new Map(current.map((m) => [m.id, m]))
  for (const m of incoming) byId.set(m.id, m)
  return [...byId.values()].sort((a, b) => a.id - b.id)
}

export default function Chat() {
  const { user, logout } = useAuth()
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    // 1. Subscribe first so nothing is missed while history loads.
    echo.channel('chat.global').listen('.message.sent', (message) => {
      setMessages((prev) => mergeMessages(prev, [message]))
    })

    // 2. Then load history and merge it with anything that already arrived.
    fetchMessages()
      .then((history) => {
        if (!cancelled) setMessages((prev) => mergeMessages(prev, history))
      })
      .catch(() => {
        if (!cancelled) setError('Could not load messages.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      echo.leave('chat.global')
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    const text = body.trim()
    if (!text || sending) return

    setSending(true)
    setError('')
    try {
      const saved = await sendMessage(text)
      setMessages((prev) => mergeMessages(prev, [saved]))
      setBody('')
    } catch (err) {
      setError(
        err.response?.data?.errors?.body?.[0] ??
          err.response?.data?.message ??
          'Could not send message.'
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="chat">
      <header className="chat-header">
        <h2>Global chat</h2>
        <div>
          <span>{user.name}</span>
          <button onClick={logout}>Log out</button>
        </div>
      </header>

      <div className="chat-messages">
        {loading && <p className="chat-status">Loading messages...</p>}
        {!loading && messages.length === 0 && (
          <p className="chat-status">No messages yet. Say hi!</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`chat-message ${m.sender?.id === user.id ? 'mine' : ''}`}
          >
            <div className="chat-meta">
              <strong>{m.sender?.name}</strong>
              <time>{new Date(m.created_at).toLocaleTimeString()}</time>
            </div>
            <p>{m.body}</p>
          </div>
        ))}
      </div>

      {error && <p className="chat-error">{error}</p>}

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
        />
        <button type="submit" disabled={sending || !body.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}