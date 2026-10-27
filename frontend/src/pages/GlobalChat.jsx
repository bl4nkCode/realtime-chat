import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/useAuth";
import echo from "../lib/echo";
import { fetchMessages, sendMessage } from "../lib/messages";
import { mergeMessages } from "../lib/mergeMessages";
import { useAutoScroll } from "../lib/useAutoScroll";

function typingLabel(names) {
  if (names.length === 0) return "";
  if (names.length === 1) return `${names[0]} is typing...`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
  return "Several people are typing...";
}

export default function GlobalChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [online, setOnline] = useState([]);
  const [typing, setTyping] = useState({}); // user id -> name

  const channelRef = useRef(null);
  const typingTimers = useRef(new Map());
  const lastWhisper = useRef(0);
  const { containerRef, onScroll, jumpToBottom } = useAutoScroll(messages);

  useEffect(() => {
    let cancelled = false;
    const timers = typingTimers.current;

    function clearTyping(id) {
      clearTimeout(timers.get(id));
      timers.delete(id);
      setTyping((prev) => {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }

    // 1. Join first so nothing is missed while history loads.
    const channel = echo
      .join("chat.global")
      .here((users) => setOnline(users))
      .joining((member) =>
        setOnline((prev) =>
          prev.some((u) => u.id === member.id) ? prev : [...prev, member],
        ),
      )
      .leaving((member) => {
        setOnline((prev) => prev.filter((u) => u.id !== member.id));
        clearTyping(member.id);
      })
      .listen(".message.sent", (message) => {
        setMessages((prev) => mergeMessages(prev, [message]));
        clearTyping(message.sender.id); // they finished typing
      })
      .listenForWhisper("typing", ({ id, name }) => {
        setTyping((prev) => ({ ...prev, [id]: name }));
        clearTimeout(timers.get(id));
        timers.set(
          id,
          setTimeout(() => clearTyping(id), 3000),
        );
      })
      .error(() => setError("Could not join the live chat."));

    channelRef.current = channel;

    // 2. Then load history and merge it with anything that already arrived.
    fetchMessages()
      .then((history) => {
        if (!cancelled) setMessages((prev) => mergeMessages(prev, history));
      })
      .catch(() => {
        if (!cancelled) setError("Could not load messages.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      channelRef.current = null;
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      channel.stopListening(".message.sent");
      echo.leave("chat.global");
    };
  }, []);

  function handleChange(e) {
    const value = e.target.value;
    setBody(value);

    // Tell the others I'm typing, at most once every 2 seconds.
    const now = Date.now();
    if (value && now - lastWhisper.current > 2000) {
      lastWhisper.current = now;
      channelRef.current?.whisper("typing", { id: user.id, name: user.name });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;

    setSending(true);
    setError("");
    try {
      const saved = await sendMessage(text);
      jumpToBottom();
      setMessages((prev) => mergeMessages(prev, [saved]));
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
        <h2>Global chat</h2>
      </header>

      <div className="chat-online">
        <strong>Online ({online.length}):</strong>{" "}
        {online
          .map((u) => (u.id === user.id ? `${u.name} (you)` : u.name))
          .join(", ")}
      </div>

      <div className="chat-messages" ref={containerRef} onScroll={onScroll}>
        {loading && <p className="chat-status">Loading messages...</p>}
        {!loading && messages.length === 0 && (
          <p className="chat-status">No messages yet. Say hi!</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`chat-message ${m.sender?.id === user.id ? "mine" : ""}`}
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

      <div className="chat-typing">{typingLabel(Object.values(typing))}</div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          value={body}
          onChange={handleChange}
          placeholder="Type a message..."
          disabled={sending}
        />
        <button type="submit" disabled={sending || !body.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
