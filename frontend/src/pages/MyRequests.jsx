import { useEffect, useState } from "react";
import api from "../api/client";
import StatusBadge from "../components/StatusBadge";

export default function MyRequests() {
  const [requests, setRequests] = useState([]);

  function load() {
    api.get("/requests").then((res) => setRequests(res.data));
  }
  useEffect(load, []);

  async function cancel(id) {
    await api.patch(`/requests/${id}/cancel`);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My requests</h1>
          <p>Track the status of every request you've submitted.</p>
        </div>
      </div>

      <div className="card">
        {requests.length === 0 ? (
          <p className="empty-state">You haven't submitted any requests yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Details</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id}>
                  <td>{r.requestType.replace(/_/g, " ")}</td>
                  <td>
                    {r.eventTitle || r.relatedBooking?.title || "—"}
                    <div style={{ fontSize: "0.78rem", color: "var(--slate)" }}>{r.reason}</div>
                    {r.reviewNote && (
                      <div style={{ fontSize: "0.78rem", color: "var(--slate)" }}>Note: {r.reviewNote}</div>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>
                    {r.status === "PENDING" && (
                      <button className="btn btn-outline btn-sm" onClick={() => cancel(r._id)}>
                        Cancel
                      </button>
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
