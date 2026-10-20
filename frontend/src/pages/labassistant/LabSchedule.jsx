import { useEffect, useState } from "react";
import api from "../../api/client";
import ScheduleGrid from "../../components/ScheduleGrid";

function toDateInput(d) {
  return d.toISOString().slice(0, 10);
}

export default function LabSchedule() {
  const [date, setDate] = useState(toDateInput(new Date()));
  const [labs, setLabs] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    api.get("/venues", { params: { type: "Laboratory" } }).then((res) => setLabs(res.data));
    api.get("/timeslots?activeOnly=true").then((res) => setTimeSlots(res.data));
  }, []);

  useEffect(() => {
    api.get("/bookings/schedule", { params: { from: date, to: date } }).then((res) => setBookings(res.data));
  }, [date]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Laboratory schedule</h1>
          <p>Bookings and upcoming practical sessions across all labs and computer centers.</p>
        </div>
      </div>

      <div className="card">
        <label htmlFor="date">Date</label>
        <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ maxWidth: 200 }} />
      </div>

      <div className="card">
        <ScheduleGrid venues={labs} timeSlots={timeSlots} bookings={bookings} />
      </div>
    </div>
  );
}
