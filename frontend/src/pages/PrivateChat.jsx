import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router";
import { useAuth } from "../context/useAuth";
import { useChat } from "../context/useChat";
import {
  fetchConversationMessages,
  fetchUser,
  sendPrivateMessage,
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
  const { upsert, setActiveChat, markRead, onMessage, onRead } = useChat();
  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const { containerRef, onScroll, jumpToBottom } = useAutoScroll(messages);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    // Tell the provider this chat is open, so it doesn't add unread badges.
    setActiveChat(partnerId);

    // A new message from this person while the chat is open.
    const offMessage = onMessage((message) => {
      if (message.sender.id !== partnerId) return;
      setMessages((prev) => mergeMessages(prev, [message]));
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
        setError(
          err.response?.status === 404
            ? "User not found."
            : "Could not load this conversation.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      setActiveChat(null);
      offMessage();
      offRead();
    };
  }, [partnerId, setActiveChat, onMessage, onRead, markRead]);

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
        <h2>{partner ? partner.name : "Conversation"}</h2>
      </header>

      <div className="chat-messages" ref={containerRef} onScroll={onScroll}>
        {loading && <p className="chat-status">Loading messages...</p>}
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

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
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
