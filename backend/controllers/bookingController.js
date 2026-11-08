const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const { validateBooking, findAvailableVenues, normalizeDate } = require("../utils/conflictDetection");
const { weeklyDates } = require("../utils/recurrence");
const { notify } = require("../utils/notify");

// Admin creates a single lecture allocation (one date), or a recurring
// weekly series by passing recurrence: { weekly: true, endDate }
exports.createBooking = async (req, res, next) => {
  try {
    const {
      venue,
      timeSlot,
      date,
      title,
      course,
      lecturer,
      expectedStudents,
      type = "REGULAR",
      notes,
      recurrence, // optional: { weekly: true, endDate }
    } = req.body;

    if (!venue || !timeSlot || !date || !title || expectedStudents == null) {
      return res
        .status(400)
        .json({ message: "venue, timeSlot, date, title and expectedStudents are required" });
    }

    const dates = recurrence?.weekly
      ? weeklyDates(date, recurrence.endDate, normalizeDate(date).getUTCDay())
      : [normalizeDate(date)];

    if (!dates.length) {
      return res.status(400).json({ message: "No valid dates to book (check endDate)" });
    }

    // Validate every occurrence up front so a mid-series conflict doesn't
    // leave a partially-created series.
    const failures = [];
    for (const d of dates) {
      const result = await validateBooking({ venue, timeSlot, date: d, expectedStudents });
      if (!result.ok) failures.push({ date: d, reason: result.reason });
    }
    if (failures.length) {
      return res.status(409).json({ message: "Booking conflicts found", failures });
    }

    const seriesId = dates.length > 1 ? new mongoose.Types.ObjectId() : undefined;
    const created = await Booking.insertMany(
      dates.map((d) => ({
        venue,
        timeSlot,
        date: d,
        title,
        course,
        lecturer,
        expectedStudents,
        type,
        notes,
        seriesId,
        createdBy: req.user._id,
      }))
    );

    if (lecturer) {
      await notify(lecturer, {
        title: "New lecture allocation",
        message: `"${title}" allocated to ${dates.length} date(s), starting ${dates[0].toDateString()}`,
        type: "ALLOCATION",
        link: "/lecturer/schedule",
      });
    }

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

// Anyone authenticated can view the full schedule (read-only visibility is
// core to the "how do I know what's free" feature).
exports.getSchedule = async (req, res, next) => {
  try {
    const { from, to, venue, lecturer } = req.query;
    const filter = { status: "ACTIVE" };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = normalizeDate(from);
      if (to) filter.date.$lte = normalizeDate(to);
    }
    if (venue) filter.venue = venue;
    if (lecturer) filter.lecturer = lecturer;

    const bookings = await Booking.find(filter)
      .populate("venue", "name capacity type")
      .populate("timeSlot", "name startTime endTime")
      .populate("lecturer", "name email")
      .populate("course", "name code")
      .sort({ date: 1, "timeSlot.startTime": 1 });

    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

exports.getMySchedule = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ lecturer: req.user._id, status: "ACTIVE" })
      .populate("venue", "name capacity type")
      .populate("timeSlot", "name startTime endTime")
      .populate("course", "name code")
      .sort({ date: 1 });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

// Search which venues are free for a given date + slot + size (feature #12)
exports.searchAvailability = async (req, res, next) => {
  try {
    const { date, timeSlot, minCapacity, facilities } = req.query;
    if (!date || !timeSlot) {
      return res.status(400).json({ message: "date and timeSlot are required" });
    }
    const requiredFacilities = facilities
      ? String(facilities)
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean)
      : [];

    const venues = await findAvailableVenues({
      date,
      timeSlot,
      minCapacity: Number(minCapacity) || 0,
      requiredFacilities,
    });
    res.json(venues);
  } catch (err) {
    next(err);
  }
};

// Admin can override/cancel any booking; a lecturer may cancel their own.
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const isOwner = booking.lecturer && booking.lecturer.equals(req.user._id);
    if (req.user.role !== "ADMIN" && !isOwner) {
      return res.status(403).json({ message: "You cannot cancel this booking" });
    }

    booking.status = "CANCELLED";
    await booking.save();

    if (booking.lecturer) {
      await notify(booking.lecturer, {
        title: "Booking cancelled",
        message: `"${booking.title}" on ${booking.date.toDateString()} was cancelled`,
        type: "SCHEDULE_CHANGE",
      });
    }

    res.json({ message: "Booking cancelled" });
  } catch (err) {
    next(err);
  }
};

// Admin override: move a booking directly (bypasses request/approval flow)
exports.overrideBooking = async (req, res, next) => {
  try {
    const { venue, timeSlot, date, expectedStudents } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const result = await validateBooking({
      venue: venue || booking.venue,
      timeSlot: timeSlot || booking.timeSlot,
      date: date || booking.date,
      expectedStudents: expectedStudents ?? booking.expectedStudents,
      excludeBookingId: booking._id,
    });
    if (!result.ok) return res.status(409).json({ message: result.reason });

    if (venue) booking.venue = venue;
    if (timeSlot) booking.timeSlot = timeSlot;
    if (date) booking.date = normalizeDate(date);
    if (expectedStudents != null) booking.expectedStudents = expectedStudents;
    await booking.save();

    if (booking.lecturer) {
      await notify(booking.lecturer, {
        title: "Your booking was updated by Admin",
        message: `"${booking.title}" has new details — check your schedule`,
        type: "SCHEDULE_CHANGE",
        link: "/lecturer/schedule",
      });
    }

    res.json(booking);
  } catch (err) {
    next(err);
  }
};
