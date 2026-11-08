import { useEffect, useState } from "react";
import api from "../../api/client";

export default function MySchedule() {
  const [bookings, setBookings] = useState([]);
  const [venues, setVenues] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [requestFor, setRequestFor] = useState(null);
  const [reqForm, setReqForm] = useState({ requestType: "CHANGE_TIME", proposedVenue: "", proposedTimeSlot: "", proposedDate: "", reason: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function load() {
    api.get("/bookings/my-schedule").then((res) => setBookings(res.data));
  }
  useEffect(load, []);
  useEffect(() => {
    api.get("/venues", { params: { status: "available" } }).then((res) => setVenues(res.data));
    api.get("/timeslots?activeOnly=true").then((res) => setTimeSlots(res.data));
  }, []);

  async function cancelBooking(id) {
    if (!confirm("Cancel this lecture?")) return;
    await api.delete(`/bookings/${id}`);
    load();
  }

  function openRequest(booking) {
    setRequestFor(booking);
    setReqForm({ requestType: "CHANGE_TIME", proposedVenue: "", proposedTimeSlot: "", proposedDate: "", reason: "" });
    setError("");
    setSuccess("");
  }

  async function submitRequest(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/requests", {
        requestType: reqForm.requestType,
        relatedBooking: requestFor._id,
        proposedVenue: reqForm.proposedVenue || undefined,
        proposedTimeSlot: reqForm.proposedTimeSlot || undefined,
        proposedDate: reqForm.proposedDate || undefined,
        reason: reqForm.reason,
      });
      setSuccess("Request submitted to Admin.");
      setRequestFor(null);
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit request");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My schedule</h1>
          <p>Your allocated lectures. Request a change or cancel if needed.</p>
        </div>
      </div>

      {success && <p style={{ color: "var(--success)" }}>{success}</p>}

      <div className="card">
        {bookings.length === 0 ? (
          <p className="empty-state">No lectures allocated yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Subject</th>
                <th>Venue</th>
                <th>Time</th>
                <th>Students</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td>{new Date(b.date).toDateString()}</td>
                  <td>{b.title}</td>
                  <td>{b.venue?.name}</td>
                  <td>
                    {b.timeSlot?.startTime}–{b.timeSlot?.endTime}
                  </td>
                  <td>{b.expectedStudents}</td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openRequest(b)}>
                      Request change
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => cancelBooking(b._id)}>
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {requestFor && (
        <div className="card">
          <h3>Request a change — {requestFor.title}</h3>
          <form onSubmit={submitRequest}>
            <label>What do you need?</label>
            <select
              value={reqForm.requestType}
              onChange={(e) => setReqForm({ ...reqForm, requestType: e.target.value })}
            >
              <option value="CHANGE_TIME">Different time slot</option>
              <option value="CHANGE_VENUE">Different venue</option>
              <option value="CHANGE_BOTH">Different time and venue</option>
            </select>

            <div className="form-row">
              {reqForm.requestType !== "CHANGE_TIME" && (
                <div>
                  <label>Preferred venue</label>
                  <select
                    value={reqForm.proposedVenue}
                    onChange={(e) => setReqForm({ ...reqForm, proposedVenue: e.target.value })}
                  >
                    <option value="">No preference</option>
                    {venues.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {reqForm.requestType !== "CHANGE_VENUE" && (
                <div>
                  <label>Preferred time slot</label>
                  <select
                    value={reqForm.proposedTimeSlot}
                    onChange={(e) => setReqForm({ ...reqForm, proposedTimeSlot: e.target.value })}
                  >
                    <option value="">No preference</option>
                    {timeSlots.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <label>Reason</label>
            <textarea value={reqForm.reason} onChange={(e) => setReqForm({ ...reqForm, reason: e.target.value })} required />

            {error && <p className="error-text">{error}</p>}
            <div className="form-actions">
              <button className="btn btn-primary">Submit request</button>
              <button type="button" className="btn btn-outline" onClick={() => setRequestFor(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
