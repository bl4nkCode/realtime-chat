import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import { useAuth } from "../context/useAuth";
import { useChat } from "../context/useChat";
import { searchUsers } from "../lib/conversations";

const linkClass = ({ isActive }) => `side-item${isActive ? " active" : ""}`;

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { conversations, status, retryConversations } = useChat();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState({ term: "", users: [] });

  const term = search.trim();
  const searching = term !== "";
  const resultsReady = results.term === term;

  // Wait 300 ms after typing stops, and ignore answers to older searches.
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
      <div className="sidebar-top">
        <strong>{user.name}</strong>
        <button onClick={logout}>Log out</button>
      </div>

      <NavLink to="/" end className={linkClass}>
        <div className="side-item-text">
          <strong>Global chat</strong>
        </div>
      </NavLink>

      <div className="sidebar-search">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search people..."
        />
      </div>

      <div className="sidebar-list">
        {searching ? (
          <>
            {!resultsReady && <p className="sidebar-empty">Searching...</p>}
            {resultsReady && results.users.length === 0 && (
              <p className="sidebar-empty">No users found.</p>
            )}
            {resultsReady &&
              results.users.map((u) => (
                <NavLink
                  key={u.id}
                  to={`/c/${u.id}`}
                  className={linkClass}
                  onClick={() => setSearch("")}
                >
                  <div className="side-item-text">
                    <strong>{u.name}</strong>
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
                Could not load conversations.{" "}
                <button onClick={retryConversations}>Retry</button>
              </p>
            )}
            {status === "ready" && conversations.length === 0 && (
              <p className="sidebar-empty">
                No conversations yet. Search for someone to start one.
              </p>
            )}
            {conversations.map((c) => (
              <NavLink
                key={c.user.id}
                to={`/c/${c.user.id}`}
                className={linkClass}
              >
                <div className="side-item-text">
                  <strong>{c.user.name}</strong>
                  <small>
                    {c.last_message.sender?.id === user.id ? "You: " : ""}
                    {c.last_message.body}
                  </small>
                </div>
                {c.unread_count > 0 && (
                  <span className="badge">{c.unread_count}</span>
                )}
              </NavLink>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}
