import { useEffect, useState } from "react";
import api from "../../api/client";
import StatusBadge from "../../components/StatusBadge";

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [venues, setVenues] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [filter, setFilter] = useState("PENDING");
  const [picks, setPicks] = useState({}); // requestId -> { venue, timeSlot, date }
  const [error, setError] = useState("");

  function load() {
    api.get("/requests", { params: filter ? { status: filter } : {} }).then((res) => setRequests(res.data));
  }
  useEffect(load, [filter]);
  useEffect(() => {
    api.get("/venues").then((res) => setVenues(res.data));
    api.get("/timeslots?activeOnly=true").then((res) => setTimeSlots(res.data));
  }, []);

  function setPick(id, field, value) {
    setPicks((p) => ({ ...p, [id]: { ...p[id], [field]: value } }));
  }

  async function approve(req) {
    setError("");
    const pick = picks[req._id] || {};
    try {
      await api.patch(`/requests/${req._id}/approve`, {
        venue: pick.venue,
        timeSlot: pick.timeSlot,
        date: pick.date,
      });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not approve request");
    }
  }

  async function reject(req) {
    const reviewNote = prompt("Reason for rejection (optional):") || "";
    await api.patch(`/requests/${req._id}/reject`, { reviewNote });
    load();
  }

  const isSpecial = (t) => t.startsWith("SPECIAL");

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Requests</h1>
          <p>Change requests and special venue/event requests awaiting review.</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 160 }}>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="">All</option>
        </select>
      </div>

      {error && <p className="error-text">{error}</p>}

      {requests.length === 0 ? (
        <div className="card">
          <p className="empty-state">Nothing here.</p>
        </div>
      ) : (
        requests.map((req) => (
          <div className="card" key={req._id}>
            <div className="page-header" style={{ marginBottom: 8 }}>
              <div>
                <strong>{req.requestType.replace(/_/g, " ")}</strong> — {req.requester?.name} (
                {req.requester?.role})
              </div>
              <StatusBadge status={req.status} />
            </div>
            <p style={{ color: "var(--slate)", margin: "4px 0" }}>{req.reason}</p>

            {req.relatedBooking && (
              <p style={{ fontSize: "0.85rem" }}>
                Current: {req.relatedBooking.title} — {new Date(req.relatedBooking.date).toDateString()}
              </p>
            )}
            {isSpecial(req.requestType) && (
              <p style={{ fontSize: "0.85rem" }}>
                {req.eventTitle} · {req.expectedStudents} students
                {req.requiredFacilities?.length ? ` · needs: ${req.requiredFacilities.join(", ")}` : ""}
                {req.proposedDate ? ` · preferred date: ${new Date(req.proposedDate).toDateString()}` : ""}
              </p>
            )}

            {req.status === "PENDING" && (
              <>
                <div className="form-row">
                  <div>
                    <label>Venue</label>
                    <select
                      value={picks[req._id]?.venue || ""}
                      onChange={(e) => setPick(req._id, "venue", e.target.value)}
                    >
                      <option value="">Keep / choose venue</option>
                      {venues.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.name} (cap {v.capacity})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Time slot</label>
                    <select
                      value={picks[req._id]?.timeSlot || ""}
                      onChange={(e) => setPick(req._id, "timeSlot", e.target.value)}
                    >
                      <option value="">Keep / choose slot</option>
                      {timeSlots.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.startTime}–{s.endTime})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Date</label>
                    <input
                      type="date"
                      value={picks[req._id]?.date || ""}
                      onChange={(e) => setPick(req._id, "date", e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => approve(req)}>
                    Approve
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => reject(req)}>
                    Reject
                  </button>
                </div>
              </>
            )}
            {req.reviewNote && (
              <p style={{ fontSize: "0.82rem", color: "var(--slate)" }}>Note: {req.reviewNote}</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
