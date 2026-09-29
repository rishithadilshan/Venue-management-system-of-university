import { useEffect, useState } from "react";
import api from "../api/client";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api
      .get("/notifications")
      .then((res) => setItems(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function markRead(id) {
    await api.patch(`/notifications/${id}/read`);
    load();
  }

  async function markAllRead() {
    await api.patch("/notifications/read-all");
    load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>Allocations, request updates and schedule changes land here.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={markAllRead}>
          Mark all as read
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : items.length === 0 ? (
          <p className="empty-state">You're all caught up.</p>
        ) : (
          items.map((n) => (
            <div key={n._id} className={`notif-item ${n.read ? "" : "unread"}`}>
              <strong>{n.title}</strong>
              <div style={{ color: "var(--slate)", fontSize: "0.86rem" }}>{n.message}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--slate)", marginTop: 4 }}>
                {new Date(n.createdAt).toLocaleString()}
                {!n.read && (
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ marginLeft: 10 }}
                    onClick={() => markRead(n._id)}
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
