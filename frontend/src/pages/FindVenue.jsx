import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function FindVenue() {
  const { user } = useAuth();
  const [timeSlots, setTimeSlots] = useState([]);
  const [search, setSearch] = useState({
    date: new Date().toISOString().slice(0, 10),
    timeSlot: "",
    minCapacity: "",
    facilities: "",
  });
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const [showRequest, setShowRequest] = useState(false);
  const [reqForm, setReqForm] = useState({ eventTitle: "", reason: "" });
  const [reqSuccess, setReqSuccess] = useState("");
  const [reqError, setReqError] = useState("");

  useEffect(() => {
    api.get("/timeslots?activeOnly=true").then((res) => setTimeSlots(res.data));
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    setError("");
    setResults(null);
    try {
      const res = await api.get("/bookings/availability", {
        params: {
          date: search.date,
          timeSlot: search.timeSlot,
          minCapacity: search.minCapacity || undefined,
          facilities: search.facilities || undefined,
        },
      });
      setResults(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not search availability");
    }
  }

  async function submitSpecialRequest(e) {
    e.preventDefault();
    setReqError("");
    setReqSuccess("");
    try {
      await api.post("/requests", {
        requestType: user.role === "STUDENT" ? "SPECIAL_STUDENT_EVENT" : "SPECIAL_LECTURE",
        proposedDate: search.date,
        proposedTimeSlot: search.timeSlot || undefined,
        expectedStudents: Number(search.minCapacity) || 0,
        requiredFacilities: search.facilities
          ? search.facilities.split(",").map((f) => f.trim()).filter(Boolean)
          : [],
        eventTitle: reqForm.eventTitle,
        reason: reqForm.reason,
      });
      setReqSuccess("Request sent to Admin for approval.");
      setShowRequest(false);
      setReqForm({ eventTitle: "", reason: "" });
    } catch (err) {
      setReqError(err.response?.data?.message || "Could not submit request");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Find an available venue</h1>
          <p>Search by date, time slot, size and facilities before requesting a booking.</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSearch}>
          <div className="form-row">
            <div>
              <label>Date</label>
              <input
                type="date"
                value={search.date}
                onChange={(e) => setSearch({ ...search, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Time slot</label>
              <select
                value={search.timeSlot}
                onChange={(e) => setSearch({ ...search, timeSlot: e.target.value })}
                required
              >
                <option value="">Select a time slot</option>
                {timeSlots.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.startTime}–{s.endTime})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div>
              <label>Minimum capacity</label>
              <input
                type="number"
                min="0"
                value={search.minCapacity}
                onChange={(e) => setSearch({ ...search, minCapacity: e.target.value })}
              />
            </div>
            <div>
              <label>Required facilities (comma separated)</label>
              <input
                placeholder="Projector, Audio system"
                value={search.facilities}
                onChange={(e) => setSearch({ ...search, facilities: e.target.value })}
              />
            </div>
          </div>
          {error && <p className="error-text">{error}</p>}
          <div className="form-actions">
            <button className="btn btn-primary">Search</button>
          </div>
        </form>
      </div>

      {results && (
        <div className="card">
          <h3>Available venues</h3>
          {results.length === 0 ? (
            <p className="empty-state">Nothing free that matches — try different criteria.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Venue</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Facilities</th>
                </tr>
              </thead>
              <tbody>
                {results.map((v) => (
                  <tr key={v._id}>
                    <td>{v.name}</td>
                    <td>{v.type}</td>
                    <td>{v.capacity}</td>
                    <td>{v.facilities?.join(", ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="form-actions">
            <button className="btn btn-amber" onClick={() => setShowRequest(true)}>
              Request this slot for a {user.role === "STUDENT" ? "student event" : "special lecture"}
            </button>
          </div>
        </div>
      )}

      {reqSuccess && <p style={{ color: "var(--success)" }}>{reqSuccess}</p>}

      {showRequest && (
        <div className="card">
          <h3>Special booking request</h3>
          <form onSubmit={submitSpecialRequest}>
            <label>Event / lecture title</label>
            <input
              value={reqForm.eventTitle}
              onChange={(e) => setReqForm({ ...reqForm, eventTitle: e.target.value })}
              required
            />
            <label>Reason</label>
            <textarea
              value={reqForm.reason}
              onChange={(e) => setReqForm({ ...reqForm, reason: e.target.value })}
              required
            />
            {reqError && <p className="error-text">{reqError}</p>}
            <div className="form-actions">
              <button className="btn btn-primary">Send request</button>
              <button type="button" className="btn btn-outline" onClick={() => setShowRequest(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
