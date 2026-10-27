import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import echo from '../lib/echo'
import {
  fetchConversations,
  markConversationRead,
} from '../lib/conversations'
import { ChatContext } from './chatContext'
import { useAuth } from './useAuth'

// Merge the fetched list into what live events already put in state.
function mergeConversations(local, fetched) {
  const result = new Map(fetched.map((c) => [c.user.id, c]))
  for (const l of local) {
    const f = result.get(l.user.id)
    if (!f) {
      result.set(l.user.id, l)
    } else if (l.last_message.id > f.last_message.id) {
      // A live message arrived after the fetch was built: keep it, and add
      // the unread count the fetch didn't know about.
      result.set(l.user.id, { ...l, unread_count: f.unread_count + l.unread_count })
    }
  }
  return [...result.values()].sort((a, b) => b.last_message.id - a.last_message.id)
}

export default function ChatProvider({ children }) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const activeChatRef = useRef(null) // id of the private chat currently open
  const messageHandlers = useRef(new Set())
  const readHandlers = useRef(new Set())
  const typingHandlers = useRef(new Set())

  // Put a conversation at the top with a new last message.
  const upsert = useCallback((partner, lastMessage, incrementUnread = false) => {
    setConversations((prev) => {
      const existing = prev.find((c) => c.user.id === partner.id)

      // Same message delivered twice (or an older one): nothing to change.
      if (existing && existing.last_message.id >= lastMessage.id) return prev

      const updated = {
        user: { id: partner.id, name: partner.name },
        last_message: lastMessage,
        unread_count: (existing?.unread_count ?? 0) + (incrementUnread ? 1 : 0),
      }
      return [updated, ...prev.filter((c) => c.user.id !== partner.id)]
    })
  }, [])

  const loadConversations = useCallback(() => {
    return fetchConversations()
      .then((list) => {
        setConversations((prev) => mergeConversations(prev, list))
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  const retryConversations = useCallback(() => {
    setStatus('loading')
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    const channelName = `chat.user.${user.id}`

    // 1. Subscribe first, so nothing is missed while the list loads.
    const channel = echo
      .private(channelName)
      .listen('.private-message.sent', (message) => {
        const partner = message.sender
        const isOpen = activeChatRef.current === partner.id
        upsert(partner, message, !isOpen)
        messageHandlers.current.forEach((handler) => handler(message))
      })
      .listen('.messages.read', (payload) => {
        setConversations((prev) =>
          prev.map((c) =>
            payload.message_ids.includes(c.last_message.id)
              ? { ...c, last_message: { ...c.last_message, read_at: payload.read_at } }
              : c,
          ),
        )
        readHandlers.current.forEach((handler) => handler(payload))
      })
      .listen('.user.typing', (payload) => {
        typingHandlers.current.forEach((handler) => handler(payload))
      })

    // 2. Then load the list and merge it with anything that already arrived.
    loadConversations()

    return () => {
      // Remove this run's listeners so a re-run (StrictMode) can't leave
      // duplicates attached to the shared channel.
      channel
        .stopListening('.private-message.sent')
        .stopListening('.messages.read')
        .stopListening('.user.typing')
      echo.leave(channelName)
    }
  }, [user.id, upsert, loadConversations])

  const setActiveChat = useCallback((userId) => {
    activeChatRef.current = userId
  }, [])

  const markRead = useCallback(async (userId) => {
    setConversations((prev) =>
      prev.map((c) => (c.user.id === userId ? { ...c, unread_count: 0 } : c)),
    )
    try {
      await markConversationRead(userId)
    } catch {
      // The next time the chat opens, it tries again.
    }
  }, [])

  // Handlers let a chat screen react to events without its own subscription.
  const onMessage = useCallback((handler) => {
    messageHandlers.current.add(handler)
    return () => {
      messageHandlers.current.delete(handler)
    }
  }, [])

  const onRead = useCallback((handler) => {
    readHandlers.current.add(handler)
    return () => {
      readHandlers.current.delete(handler)
    }
  }, [])

  const onTyping = useCallback((handler) => {
    typingHandlers.current.add(handler)
    return () => {
      typingHandlers.current.delete(handler)
    }
  }, [])

  const value = useMemo(
    () => ({
      conversations,
      status,
      retryConversations,
      upsert,
      setActiveChat,
      markRead,
      onMessage,
      onRead,
      onTyping,
    }),
    [
      conversations,
      status,
      retryConversations,
      upsert,
      setActiveChat,
      markRead,
      onMessage,
      onRead,
      onTyping,
    ],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}