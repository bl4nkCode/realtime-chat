import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import { useAuth } from "../context/useAuth";
import { useChat } from "../context/useChat";
import { searchUsers } from "../lib/conversations";

const linkClass = ({ isActive }) => `side-item${isActive ? " active" : ""}`;

function InitialAvatar({ name, className = "" }) {
  const colors = [
    "avatar-purple",
    "avatar-blue",
    "avatar-pink",
    "avatar-teal",
    "avatar-orange",
  ];

  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "?";

  // Give each name a consistent avatar color.
  const colorIndex =
    Array.from(name || "").reduce(
      (total, character) => total + character.charCodeAt(0),
      0,
    ) % colors.length;

  return (
    <span
      className={`side-item-icon user-list-avatar ${colors[colorIndex]} ${className}`}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { conversations, status, retryConversations } = useChat();

  const [search, setSearch] = useState("");
  const [results, setResults] = useState({ term: "", users: [] });

  const term = search.trim();
  const searching = term !== "";
  const resultsReady = results.term === term;

  useEffect(() => {
    if (!term) return;

    let cancelled = false;

    const timer = setTimeout(() => {
      searchUsers(term)
        .then((users) => {
          if (!cancelled) setResults({ term, users });
        })
        .catch(() => {
          if (!cancelled) setResults({ term, users: [] });
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term]);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark" aria-hidden="true">
          M
        </div>

        <div className="brand-copy">
          <strong>Midnight</strong>
          <small>Real-time messaging</small>
        </div>
      </div>

      <div className="sidebar-divider" />

      <p className="sidebar-section-label">Workspace</p>

      <nav className="sidebar-nav" aria-label="Main navigation">
        <NavLink to="/" end className={linkClass}>
          <span className="side-item-icon" aria-hidden="true">
            #
          </span>

          <div className="side-item-text">
            <strong>Global chat</strong>
            <small>Chat with everyone</small>
          </div>
        </NavLink>
      </nav>

      <p className="sidebar-section-label">Direct messages</p>

      <div className="sidebar-search">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search people..."
          aria-label="Search people"
        />
      </div>

      <div className="sidebar-list">
        {searching ? (
          <>
            {!resultsReady && (
              <p className="sidebar-empty">Searching for people...</p>
            )}

            {resultsReady && results.users.length === 0 && (
              <p className="sidebar-empty">No users found. Try another name.</p>
            )}

            {resultsReady &&
              results.users.map((person) => (
                <NavLink
                  key={person.id}
                  to={`/c/${person.id}`}
                  className={linkClass}
                  onClick={() => setSearch("")}
                >
                  <InitialAvatar name={person.name} />

                  <div className="side-item-text">
                    <strong>{person.name}</strong>
                    <small>Start a conversation</small>
                  </div>
                </NavLink>
              ))}
          </>
        ) : (
          <>
            {status === "loading" && conversations.length === 0 && (
              <p className="sidebar-empty">Loading conversations...</p>
            )}

            {status === "error" && (
              <p className="sidebar-empty chat-error">
                Could not load conversations.
                <button onClick={retryConversations}>Retry</button>
              </p>
            )}

            {status === "ready" && conversations.length === 0 && (
              <p className="sidebar-empty">
                No conversations yet. Search for someone to start chatting.
              </p>
            )}

            {conversations.map((conversation) => {
              const person = conversation.user;
              const lastMessage = conversation.last_message;

              return (
                <NavLink
                  key={person.id}
                  to={`/c/${person.id}`}
                  className={linkClass}
                >
                  <InitialAvatar name={person.name} />

                  <div className="side-item-text">
                    <strong>{person.name}</strong>

                    <small>
                      {lastMessage
                        ? `${lastMessage.sender?.id === user.id ? "You: " : ""}${lastMessage.body}`
                        : "Start a conversation"}
                    </small>
                  </div>

                  {conversation.unread_count > 0 && (
                    <span className="badge">{conversation.unread_count}</span>
                  )}
                </NavLink>
              );
            })}
          </>
        )}
      </div>

      <div className="sidebar-top">
        <span className="user-avatar" aria-hidden="true">
          {user.name?.trim()?.charAt(0)?.toUpperCase() || "?"}
        </span>

        <div className="user-details">
          <strong>{user.name}</strong>
          <small>
            <span className="user-status-dot" />
            Connected
          </small>
        </div>

        <button onClick={logout} title="Log out">
          Log out
        </button>
      </div>
    </aside>
  );
}
