import { useEffect, useState } from "react";
import api from "../api/client";
import ScheduleGrid from "../components/ScheduleGrid";

function toDateInput(d) {
  return d.toISOString().slice(0, 10);
}

export default function Schedule() {
  const [date, setDate] = useState(toDateInput(new Date()));
  const [venues, setVenues] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [venueFilter, setVenueFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/venues").then((res) => setVenues(res.data));
    api.get("/timeslots?activeOnly=true").then((res) => setTimeSlots(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get("/bookings/schedule", { params: { from: date, to: date } })
      .then((res) => setBookings(res.data))
      .catch(() => setError("Could not load the schedule"))
      .finally(() => setLoading(false));
  }, [date]);

  const shownVenues = venueFilter ? venues.filter((v) => v._id === venueFilter) : venues;

  function shiftDay(delta) {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(toDateInput(d));
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>University venue schedule</h1>
          <p>See every booking across campus before requesting a slot.</p>
        </div>
      </div>

      <div className="card">
        <div className="form-row" style={{ alignItems: "flex-end" }}>
          <div>
            <label htmlFor="date">Date</label>
            <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="venue">Venue</label>
            <select id="venue" value={venueFilter} onChange={(e) => setVenueFilter(e.target.value)}>
              <option value="">All venues</option>
              {venues.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-outline" onClick={() => shiftDay(-1)}>
              ← Prev day
            </button>
            <button className="btn btn-outline" onClick={() => shiftDay(1)}>
              Next day →
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p className="empty-state">Loading schedule…</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : (
          <ScheduleGrid venues={shownVenues} timeSlots={timeSlots} bookings={bookings} />
        )}
      </div>
    </div>
  );
}
