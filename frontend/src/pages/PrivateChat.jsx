import { useEffect, useRef, useState } from "react";
import { Navigate, useParams } from "react-router";
import { useAuth } from "../context/useAuth";
import { useChat } from "../context/useChat";
import {
  fetchConversationMessages,
  fetchUser,
  sendPrivateMessage,
  sendTyping,
} from "../lib/conversations";
import { mergeMessages } from "../lib/mergeMessages";
import { useAutoScroll } from "../lib/useAutoScroll";

export default function PrivateChat() {
  const { userId } = useParams();
  const { user } = useAuth();
  const partnerId = Number(userId);

  if (partnerId === user.id) return <Navigate to="/" replace />;

  // The key gives each conversation fresh state when you switch between them.
  return <PrivateThread key={partnerId} partnerId={partnerId} />;
}

function PrivateThread({ partnerId }) {
  const { user } = useAuth();
  const { upsert, setActiveChat, markRead, onMessage, onRead, onTyping } =
    useChat();
  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [canRetry, setCanRetry] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [typing, setTyping] = useState(false);

  const typingTimer = useRef(null);
  const lastTypingSent = useRef(0);
  const { containerRef, onScroll, jumpToBottom } = useAutoScroll(messages);

  useEffect(() => {
    let cancelled = false;

    // Tell the provider this chat is open, so it doesn't add unread badges.
    setActiveChat(partnerId);

    // A new message from this person while the chat is open.
    const offMessage = onMessage((message) => {
      if (message.sender.id !== partnerId) return;
      setMessages((prev) => mergeMessages(prev, [message]));
      clearTimeout(typingTimer.current);
      setTyping(false); // they finished typing
      markRead(partnerId);
    });

    // They read my messages: show "Seen" without a refresh.
    const offRead = onRead((payload) => {
      if (payload.reader_id !== partnerId) return;
      setMessages((prev) =>
        prev.map((m) =>
          payload.message_ids.includes(m.id)
            ? { ...m, read_at: payload.read_at }
            : m,
        ),
      );
    });

    // They are typing: show the indicator for 3 seconds, renewed by each event.
    const offTyping = onTyping((payload) => {
      if (payload.user_id !== partnerId) return;
      setTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 3000);
    });

    // Then load the person and the history, and mark what I just opened as read.
    Promise.all([fetchUser(partnerId), fetchConversationMessages(partnerId)])
      .then(([person, history]) => {
        if (cancelled) return;
        setPartner(person);
        setMessages((prev) => mergeMessages(prev, history));
        markRead(partnerId);
      })
      .catch((err) => {
        if (cancelled) return;
        const notFound = err.response?.status === 404;
        setLoadError(
          notFound ? "User not found." : "Could not load this conversation.",
        );
        setCanRetry(!notFound);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(typingTimer.current);
      setActiveChat(null);
      offMessage();
      offRead();
      offTyping();
    };
  }, [
    partnerId,
    attempt,
    setActiveChat,
    onMessage,
    onRead,
    onTyping,
    markRead,
  ]);

  function retry() {
    setLoadError("");
    setLoading(true);
    setAttempt((a) => a + 1);
  }

  function handleChange(e) {
    const value = e.target.value;
    setBody(value);

    // Tell them I'm typing, at most once every 2 seconds.
    const now = Date.now();
    if (value && partner && now - lastTypingSent.current > 2000) {
      lastTypingSent.current = now;
      sendTyping(partnerId).catch(() => {}); // a missed indicator isn't worth an error
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending || !partner) return;

    setSending(true);
    setError("");
    try {
      const saved = await sendPrivateMessage(partnerId, text);
      jumpToBottom();
      setMessages((prev) => mergeMessages(prev, [saved]));
      upsert(partner, saved); // moves this chat to the top of the sidebar
      setBody("");
    } catch (err) {
      setError(
        err.response?.data?.errors?.body?.[0] ??
          err.response?.data?.message ??
          "Could not send message.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="chat">
      <header className="chat-header">
        <div className="chat-heading">
          <div className="chat-heading-icon direct-icon">
            {partner?.name?.trim()?.charAt(0)?.toUpperCase() || "?"}
          </div>

          <div>
            <h2>{partner ? partner.name : "Conversation"}</h2>
            <p>Direct message</p>
          </div>
        </div>

        <div className="chat-header-status">
          <span className="status-dot" />
          Private conversation
        </div>
      </header>

      <div className="chat-messages" ref={containerRef} onScroll={onScroll}>
        {loading && <p className="chat-status">Loading messages...</p>}
        {loadError && (
          <p className="chat-status chat-error">
            {loadError} {canRetry && <button onClick={retry}>Retry</button>}
          </p>
        )}
        {!loading && partner && messages.length === 0 && (
          <p className="chat-status">
            No messages yet. Say hi to {partner.name}!
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender?.id === user.id;
          return (
            <div key={m.id} className={`chat-message ${mine ? "mine" : ""}`}>
              <div className="chat-meta">
                <strong>{mine ? "You" : m.sender?.name}</strong>
                <time>{new Date(m.created_at).toLocaleTimeString()}</time>
                {mine && (
                  <span className="chat-receipt">
                    {m.read_at ? "Seen" : "Sent"}
                  </span>
                )}
              </div>
              <p>{m.body}</p>
            </div>
          );
        })}
      </div>

      {error && <p className="chat-error">{error}</p>}

      <div className="chat-typing">
        {typing && partner ? `${partner.name} is typing...` : ""}
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          value={body}
          onChange={handleChange}
          placeholder="Type a message..."
          disabled={sending || !partner}
        />
        <button type="submit" disabled={sending || !partner || !body.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
