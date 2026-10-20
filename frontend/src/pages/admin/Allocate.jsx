import { useEffect, useState } from "react";
import api from "../../api/client";

const EMPTY = {
  title: "",
  venue: "",
  timeSlot: "",
  date: new Date().toISOString().slice(0, 10),
  lecturer: "",
  expectedStudents: "",
  weekly: false,
  endDate: "",
};

export default function Allocate() {
  const [venues, setVenues] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [conflicts, setConflicts] = useState([]);
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/venues", { params: { status: "available" } }).then((res) => setVenues(res.data));
    api.get("/timeslots?activeOnly=true").then((res) => setTimeSlots(res.data));
    api.get("/users", { params: { role: "LECTURER" } }).then((res) => setLecturers(res.data));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setConflicts([]);
    setSuccess("");
    setBusy(true);
    try {
      await api.post("/bookings", {
        title: form.title,
        venue: form.venue,
        timeSlot: form.timeSlot,
        date: form.date,
        lecturer: form.lecturer || undefined,
        expectedStudents: Number(form.expectedStudents),
        recurrence: form.weekly ? { weekly: true, endDate: form.endDate } : undefined,
      });
      setSuccess("Lecture allocated. The lecturer has been notified.");
      setForm(EMPTY);
    } catch (err) {
      if (err.response?.status === 409 && err.response.data.failures) {
        setConflicts(err.response.data.failures);
      } else {
        setError(err.response?.data?.message || "Could not allocate lecture");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Allocate a lecture</h1>
          <p>Assign a venue and time slot. Capacity and conflicts are checked automatically.</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <label>Subject / title</label>
          <input value={form.title} onChange={(e) => update("title", e.target.value)} required />

          <div className="form-row">
            <div>
              <label>Venue</label>
              <select value={form.venue} onChange={(e) => update("venue", e.target.value)} required>
                <option value="">Select venue</option>
                {venues.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.name} (cap {v.capacity})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Time slot</label>
              <select value={form.timeSlot} onChange={(e) => update("timeSlot", e.target.value)} required>
                <option value="">Select time slot</option>
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
              <label>Lecturer</label>
              <select value={form.lecturer} onChange={(e) => update("lecturer", e.target.value)}>
                <option value="">Unassigned</option>
                {lecturers.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Expected students</label>
              <input
                type="number"
                min="0"
                value={form.expectedStudents}
                onChange={(e) => update("expectedStudents", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label>Date</label>
              <input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} required />
            </div>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 4px" }}>
                <input
                  type="checkbox"
                  style={{ width: "auto" }}
                  checked={form.weekly}
                  onChange={(e) => update("weekly", e.target.checked)}
                />
                Repeat weekly
              </label>
            </div>
            {form.weekly && (
              <div>
                <label>Until</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => update("endDate", e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          {error && <p className="error-text">{error}</p>}
          {success && <p style={{ color: "var(--success)", fontSize: "0.88rem", marginTop: 10 }}>{success}</p>}
          {conflicts.length > 0 && (
            <div className="error-text">
              <strong>Could not allocate — conflicts found:</strong>
              <ul>
                {conflicts.map((c, i) => (
                  <li key={i}>
                    {new Date(c.date).toDateString()}: {c.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="form-actions">
            <button className="btn btn-primary" disabled={busy}>
              {busy ? "Allocating…" : "Allocate lecture"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
