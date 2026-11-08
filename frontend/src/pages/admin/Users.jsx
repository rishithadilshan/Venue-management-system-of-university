import { useEffect, useState } from "react";
import api from "../../api/client";

const EMPTY = { name: "", email: "", password: "", role: "STUDENT" };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  function load() {
    api.get("/users").then((res) => setUsers(res.data));
  }
  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/users", form);
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create user");
    }
  }

  async function toggleActive(u) {
    await api.put(`/users/${u._id}`, { active: !u.active });
    load();
  }

  async function remove(id) {
    if (!confirm("Delete this user?")) return;
    await api.delete(`/users/${id}`);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p>Create accounts directly, or manage roles and access.</p>
        </div>
      </div>

      <div className="card">
        <h3>Add a user</h3>
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <div>
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div>
              <label>Temporary password</label>
              <input
                type="text"
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="ADMIN">Admin</option>
                <option value="LECTURER">Lecturer</option>
                <option value="STUDENT">Student</option>
                <option value="LAB_ASSISTANT">Lab Assistant</option>
              </select>
            </div>
          </div>
          {error && <p className="error-text">{error}</p>}
          <div className="form-actions">
            <button className="btn btn-primary">Create user</button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>All users</h3>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <span className={`badge ${u.active ? "badge-approved" : "badge-cancelled"}`}>
                      {u.active ? "active" : "disabled"}
                    </span>
                  </td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => toggleActive(u)}>
                      {u.active ? "Disable" : "Enable"}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(u._id)}>
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
