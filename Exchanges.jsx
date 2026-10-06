import { useEffect, useState } from "react";
import api from "../../api/client";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";

export default function Exchanges() {
  const { user } = useAuth();
  const [myBookings, setMyBookings] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [form, setForm] = useState({ fromBookingId: "", toBookingId: "", reason: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function load() {
    api.get("/bookings/my-schedule").then((res) => setMyBookings(res.data));
    api.get("/exchanges").then((res) => setExchanges(res.data));
    // Other lecturers' bookings to swap with — reuse the schedule endpoint, unfiltered by date
    const today = new Date().toISOString().slice(0, 10);
    const future = new Date();
    future.setMonth(future.getMonth() + 3);
    api
      .get("/bookings/schedule", { params: { from: today, to: future.toISOString().slice(0, 10) } })
      .then((res) => setAllBookings(res.data.filter((b) => b.lecturer)));
  }
  useEffect(load, []);

  async function offerExchange(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.post("/exchanges", form);
      setSuccess("Exchange offer sent.");
      setForm({ fromBookingId: "", toBookingId: "", reason: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create exchange offer");
    }
  }

  async function accept(id) {
    try {
      await api.patch(`/exchanges/${id}/accept`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not accept exchange");
    }
  }

  async function reject(id) {
    await api.patch(`/exchanges/${id}/reject`);
    load();
  }

  const otherLecturerBookings = allBookings.filter(
    (b) => !myBookings.some((mine) => mine._id === b._id)
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Exchange a lecture</h1>
          <p>Propose a swap with another lecturer. The backend validates conflicts before it's applied.</p>
        </div>
      </div>

      <div className="card">
        <h3>Propose a swap</h3>
        <form onSubmit={offerExchange}>
          <div className="form-row">
            <div>
              <label>Your lecture</label>
              <select
                value={form.fromBookingId}
                onChange={(e) => setForm({ ...form, fromBookingId: e.target.value })}
                required
              >
                <option value="">Select</option>
                {myBookings.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.title} — {new Date(b.date).toDateString()} ({b.venue?.name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Swap with</label>
              <select
                value={form.toBookingId}
                onChange={(e) => setForm({ ...form, toBookingId: e.target.value })}
                required
              >
                <option value="">Select</option>
                {otherLecturerBookings.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.title} — {b.lecturer?.name} — {new Date(b.date).toDateString()} ({b.venue?.name})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label>Reason</label>
          <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          {error && <p className="error-text">{error}</p>}
          {success && <p style={{ color: "var(--success)" }}>{success}</p>}
          <div className="form-actions">
            <button className="btn btn-primary">Send exchange offer</button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Your exchanges</h3>
        {exchanges.length === 0 ? (
          <p className="empty-state">No exchange offers yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {exchanges.map((ex) => (
                <tr key={ex._id}>
                  <td>
                    {ex.fromBooking?.title} ({ex.fromLecturer?.name})
                  </td>
                  <td>
                    {ex.toBooking?.title} ({ex.toLecturer?.name})
                  </td>
                  <td>
                    <StatusBadge status={ex.status} />
                  </td>
                  <td style={{ display: "flex", gap: 6 }}>
                    {ex.status === "PENDING" && ex.toLecturer?._id === user._id && (
                      <>
                        <button className="btn btn-primary btn-sm" onClick={() => accept(ex._id)}>
                          Accept
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => reject(ex._id)}>
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
