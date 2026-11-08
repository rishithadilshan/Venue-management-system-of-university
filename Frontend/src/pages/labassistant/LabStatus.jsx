import { useEffect, useState } from "react";
import api from "../../api/client";

export default function LabStatus() {
  const [labs, setLabs] = useState([]);
  const [error, setError] = useState("");

  function load() {
    api.get("/venues", { params: { type: "Laboratory" } }).then((res) => setLabs(res.data));
  }
  useEffect(load, []);

  async function setStatus(lab, status) {
    setError("");
    const note = status === "maintenance" ? prompt("What's wrong with this lab?") || "" : "";
    try {
      await api.patch(`/venues/${lab._id}/status`, { status, maintenanceNote: note });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update status");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Lab status</h1>
          <p>Report a laboratory as unavailable, or bring it back online.</p>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Lab</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Note</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {labs.map((lab) => (
              <tr key={lab._id}>
                <td>{lab.name}</td>
                <td>{lab.capacity}</td>
                <td>
                  <span className={`badge ${lab.status === "available" ? "badge-approved" : "badge-pending"}`}>
                    {lab.status}
                  </span>
                </td>
                <td style={{ color: "var(--slate)", fontSize: "0.82rem" }}>{lab.maintenanceNote || "—"}</td>
                <td>
                  {lab.status === "available" ? (
                    <button className="btn btn-danger btn-sm" onClick={() => setStatus(lab, "maintenance")}>
                      Report unavailable
                    </button>
                  ) : (
                    <button className="btn btn-primary btn-sm" onClick={() => setStatus(lab, "available")}>
                      Mark available
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
