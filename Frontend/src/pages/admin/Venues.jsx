import { useEffect, useState } from "react";
import api from "../../api/client";

const EMPTY = { name: "", capacity: "", type: "Lecture Hall", building: "", facilities: "" };

export default function Venues() {
  const [venues, setVenues] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    api.get("/venues").then((res) => setVenues(res.data));
  }
  useEffect(load, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.post("/venues", {
        name: form.name,
        capacity: Number(form.capacity),
        type: form.type,
        building: form.building,
        facilities: form.facilities
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean),
      });
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create venue");
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus(venue) {
    const next = venue.status === "available" ? "maintenance" : "available";
    const note = next === "maintenance" ? prompt("Reason for maintenance (optional):") || "" : "";
    await api.patch(`/venues/${venue._id}/status`, { status: next, maintenanceNote: note });
    load();
  }

  async function remove(id) {
    if (!confirm("Delete this venue? This cannot be undone.")) return;
    await api.delete(`/venues/${id}`);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Venues</h1>
          <p>Lecture halls, laboratories, auditoriums and seminar rooms.</p>
        </div>
      </div>

      <div className="card">
        <h3>Add a venue</h3>
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <div>
              <label>Name</label>
              <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
            </div>
            <div>
              <label>Capacity</label>
              <input
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => update("capacity", e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div>
              <label>Type</label>
              <select value={form.type} onChange={(e) => update("type", e.target.value)}>
                <option>Lecture Hall</option>
                <option>Laboratory</option>
                <option>Auditorium</option>
                <option>Seminar Room</option>
              </select>
            </div>
            <div>
              <label>Building</label>
              <input value={form.building} onChange={(e) => update("building", e.target.value)} />
            </div>
          </div>
          <label>Facilities (comma separated)</label>
          <input
            placeholder="Projector, AC, Audio system"
            value={form.facilities}
            onChange={(e) => update("facilities", e.target.value)}
          />
          {error && <p className="error-text">{error}</p>}
          <div className="form-actions">
            <button className="btn btn-primary" disabled={busy}>
              {busy ? "Adding…" : "Add venue"}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>All venues</h3>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Facilities</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {venues.map((v) => (
                <tr key={v._id}>
                  <td>{v.name}</td>
                  <td>{v.type}</td>
                  <td>{v.capacity}</td>
                  <td>{v.facilities?.join(", ") || "—"}</td>
                  <td>
                    <span
                      className={`badge ${v.status === "available" ? "badge-approved" : "badge-pending"}`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => toggleStatus(v)}>
                      {v.status === "available" ? "Mark maintenance" : "Mark available"}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(v._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
