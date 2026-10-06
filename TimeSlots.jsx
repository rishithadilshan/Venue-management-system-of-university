import { useEffect, useState } from "react";
import api from "../../api/client";

const EMPTY = { name: "", startTime: "08:30", endTime: "09:30" };

export default function TimeSlots() {
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  function load() {
    api.get("/timeslots").then((res) => setSlots(res.data));
  }
  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/timeslots", form);
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create time slot");
    }
  }

  async function toggleActive(slot) {
    await api.put(`/timeslots/${slot._id}`, { active: !slot.active });
    load();
  }

  async function remove(id) {
    if (!confirm("Delete this time slot?")) return;
    await api.delete(`/timeslots/${id}`);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Time slots</h1>
          <p>Stored in the database — change the day's schedule any time.</p>
        </div>
      </div>

      <div className="card">
        <h3>Add a time slot</h3>
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <div>
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label>Start time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                required
              />
            </div>
            <div>
              <label>End time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                required
              />
            </div>
          </div>
          {error && <p className="error-text">{error}</p>}
          <div className="form-actions">
            <button className="btn btn-primary">Add slot</button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>All time slots</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Start</th>
              <th>End</th>
              <th>Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {slots.map((s) => (
              <tr key={s._id}>
                <td>{s.name}</td>
                <td>{s.startTime}</td>
                <td>{s.endTime}</td>
                <td>
                  <span className={`badge ${s.active ? "badge-approved" : "badge-cancelled"}`}>
                    {s.active ? "active" : "inactive"}
                  </span>
                </td>
                <td style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => toggleActive(s)}>
                    {s.active ? "Deactivate" : "Activate"}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(s._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
