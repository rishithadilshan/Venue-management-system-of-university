export default function ScheduleGrid({ venues, timeSlots, bookings }) {
  const bookingFor = (venueId, slotId) =>
    bookings.find((b) => b.venue?._id === venueId && b.timeSlot?._id === slotId);

  if (!venues.length || !timeSlots.length) {
    return <p className="empty-state">No venues or time slots configured yet.</p>;
  }

  return (
    <div className="table-scroll">
      <table className="schedule-grid">
        <thead>
          <tr>
            <th>Time</th>
            {venues.map((v) => (
              <th key={v._id}>
                {v.name}
                <br />
                <span style={{ fontWeight: 400, color: "var(--slate)" }}>cap {v.capacity}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((slot) => (
            <tr key={slot._id}>
              <td>
                {slot.startTime}–{slot.endTime}
              </td>
              {venues.map((v) => {
                const booking = bookingFor(v._id, slot._id);
                return (
                  <td key={v._id}>
                    {booking ? (
                      <span className="cell-booked">
                        {booking.title}
                        <span className="meta">
                          {booking.lecturer?.name || "—"}
                          {booking.type === "SPECIAL" ? " · special" : ""}
                        </span>
                      </span>
                    ) : (
                      <span className="cell-free">Free</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
