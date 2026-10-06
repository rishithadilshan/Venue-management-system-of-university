import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";

export default function Overview() {
  const [counts, setCounts] = useState({ venues: 0, pending: 0, users: 0, today: 0 });

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([
      api.get("/venues"),
      api.get("/requests", { params: { status: "PENDING" } }),
      api.get("/users"),
      api.get("/bookings/schedule", { params: { from: today, to: today } }),
    ]).then(([venues, requests, users, bookings]) => {
      setCounts({
        venues: venues.data.length,
        pending: requests.data.length,
        users: users.data.length,
        today: bookings.data.length,
      });
    });
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Admin overview</h1>
          <p>Manage venues, timetables and requests across the university.</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Venues</h3>
          <p style={{ fontSize: "1.6rem", fontFamily: "var(--serif)", margin: 0 }}>{counts.venues}</p>
          <p className="hint-text" style={{ marginTop: 8 }}>
            <Link to="/admin/venues">Manage venues →</Link>
          </p>
        </div>
        <div className="card">
          <h3>Pending requests</h3>
          <p style={{ fontSize: "1.6rem", fontFamily: "var(--serif)", margin: 0 }}>{counts.pending}</p>
          <p className="hint-text" style={{ marginTop: 8 }}>
            <Link to="/admin/requests">Review requests →</Link>
          </p>
        </div>
        <div className="card">
          <h3>Registered users</h3>
          <p style={{ fontSize: "1.6rem", fontFamily: "var(--serif)", margin: 0 }}>{counts.users}</p>
          <p className="hint-text" style={{ marginTop: 8 }}>
            <Link to="/admin/users">Manage users →</Link>
          </p>
        </div>
        <div className="card">
          <h3>Bookings today</h3>
          <p style={{ fontSize: "1.6rem", fontFamily: "var(--serif)", margin: 0 }}>{counts.today}</p>
          <p className="hint-text" style={{ marginTop: 8 }}>
            <Link to="/schedule">View schedule →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
