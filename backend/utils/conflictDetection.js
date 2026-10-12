const Booking = require("../models/Booking");
const Venue = require("../models/Venue");

/**
 * Checks whether a venue is free for a given date + time slot.
 * Excludes a given bookingId (useful when validating an update/exchange).
 */
async function findConflictingBooking({ venue, timeSlot, date, excludeBookingId }) {
  const query = {
    venue,
    timeSlot,
    date: normalizeDate(date),
    status: "ACTIVE",
  };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };
  return Booking.findOne(query).populate("timeSlot venue lecturer course");
}

/**
 * Validates expected student count against venue capacity.
 * Returns { ok: boolean, reason?: string, venue? }
 */
async function validateCapacity(venueId, expectedStudents) {
  const venue = await Venue.findById(venueId);
  if (!venue) return { ok: false, reason: "Venue not found" };
  if (venue.status !== "available") {
    return { ok: false, reason: `Venue is currently ${venue.status}`, venue };
  }
  if (expectedStudents > venue.capacity) {
    return {
      ok: false,
      reason: `Expected students (${expectedStudents}) exceed venue capacity (${venue.capacity})`,
      venue,
    };
  }
  return { ok: true, venue };
}

/**
 * Full validation used before creating/updating any booking:
 * 1. Venue exists, is available, and has enough capacity
 * 2. No overlapping active booking in that venue/timeSlot/date
 */
async function validateBooking({ venue, timeSlot, date, expectedStudents, excludeBookingId }) {
  const capacityCheck = await validateCapacity(venue, expectedStudents);
  if (!capacityCheck.ok) return capacityCheck;

  const conflict = await findConflictingBooking({ venue, timeSlot, date, excludeBookingId });
  if (conflict) {
    return {
      ok: false,
      reason: `Venue already booked for "${conflict.title}" in this time slot on this date`,
      conflict,
    };
  }

  return { ok: true, venue: capacityCheck.venue };
}

/**
 * Finds venues that are available for a given date/timeSlot, optionally
 * filtered by minimum capacity and required facilities.
 */
async function findAvailableVenues({ date, timeSlot, minCapacity = 0, requiredFacilities = [] }) {
  const normalizedDate = normalizeDate(date);

  const bookedVenueIds = await Booking.find({
    timeSlot,
    date: normalizedDate,
    status: "ACTIVE",
  }).distinct("venue");

  const query = {
    _id: { $nin: bookedVenueIds },
    status: "available",
    capacity: { $gte: minCapacity },
  };
  if (requiredFacilities.length) {
    query.facilities = { $all: requiredFacilities };
  }

  return Venue.find(query).sort({ capacity: 1 });
}

// Strip time-of-day so date comparisons are consistent regardless of how the
// client sent the date string.
function normalizeDate(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

module.exports = {
  findConflictingBooking,
  validateCapacity,
  validateBooking,
  findAvailableVenues,
  normalizeDate,
};
