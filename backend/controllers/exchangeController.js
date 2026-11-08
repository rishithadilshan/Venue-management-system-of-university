const ExchangeRequest = require("../models/ExchangeRequest");
const Booking = require("../models/Booking");
const { validateCapacity, findConflictingBooking } = require("../utils/conflictDetection");
const { notify } = require("../utils/notify");

// Lecturer A proposes swapping their booking with Lecturer B's booking.
exports.createExchange = async (req, res, next) => {
  try {
    const { fromBookingId, toBookingId, reason } = req.body;

    const [fromBooking, toBooking] = await Promise.all([
      Booking.findById(fromBookingId),
      Booking.findById(toBookingId),
    ]);
    if (!fromBooking || !toBooking) {
      return res.status(404).json({ message: "One or both bookings not found" });
    }
    if (!fromBooking.lecturer?.equals(req.user._id)) {
      return res.status(403).json({ message: "You can only offer your own lecture for exchange" });
    }
    if (!toBooking.lecturer) {
      return res.status(400).json({ message: "Target booking has no lecturer to exchange with" });
    }

    const exchange = await ExchangeRequest.create({
      fromLecturer: req.user._id,
      fromBooking: fromBooking._id,
      toLecturer: toBooking.lecturer,
      toBooking: toBooking._id,
      reason,
    });

    await notify(toBooking.lecturer, {
      title: "Exchange request received",
      message: `${req.user.name} wants to swap "${fromBooking.title}" for your "${toBooking.title}"`,
      type: "EXCHANGE",
      link: "/lecturer/exchanges",
    });

    res.status(201).json(exchange);
  } catch (err) {
    next(err);
  }
};

exports.listExchanges = async (req, res, next) => {
  try {
    const exchanges = await ExchangeRequest.find({
      $or: [{ fromLecturer: req.user._id }, { toLecturer: req.user._id }],
    })
      .populate("fromLecturer toLecturer", "name email")
      .populate({ path: "fromBooking", populate: ["venue", "timeSlot"] })
      .populate({ path: "toBooking", populate: ["venue", "timeSlot"] })
      .sort({ createdAt: -1 });
    res.json(exchanges);
  } catch (err) {
    next(err);
  }
};

// The receiving lecturer accepts. Backend re-validates everything before
// touching the database — never trust that the frontend already checked.
exports.acceptExchange = async (req, res, next) => {
  try {
    const exchange = await ExchangeRequest.findById(req.params.id).populate("fromBooking toBooking");
    if (!exchange) return res.status(404).json({ message: "Exchange not found" });
    if (!exchange.toLecturer.equals(req.user._id)) {
      return res.status(403).json({ message: "Only the invited lecturer can accept this" });
    }
    if (exchange.status !== "PENDING") {
      return res.status(400).json({ message: `Exchange already ${exchange.status.toLowerCase()}` });
    }

    const { fromBooking, toBooking } = exchange;

    // Re-fetch fresh state in case either booking changed since the request was made
    const [freshFrom, freshTo] = await Promise.all([
      Booking.findById(fromBooking._id),
      Booking.findById(toBooking._id),
    ]);
    if (!freshFrom || !freshTo || freshFrom.status !== "ACTIVE" || freshTo.status !== "ACTIVE") {
      return res.status(409).json({ message: "One of the bookings is no longer active" });
    }

    // Capacity check: each lecturer's new venue must fit their expected students
    const [capA, capB] = await Promise.all([
      validateCapacity(freshTo.venue, freshFrom.expectedStudents),
      validateCapacity(freshFrom.venue, freshTo.expectedStudents),
    ]);
    if (!capA.ok) return res.status(409).json({ message: `Swap invalid: ${capA.reason}` });
    if (!capB.ok) return res.status(409).json({ message: `Swap invalid: ${capB.reason}` });

    // Time conflict check: after swapping, does either lecturer now double-book
    // themselves elsewhere on the same date/timeSlot? (excluding these two bookings)
    const [lecturerAConflict, lecturerBConflict] = await Promise.all([
      Booking.findOne({
        lecturer: freshFrom.lecturer,
        date: freshTo.date,
        timeSlot: freshTo.timeSlot,
        status: "ACTIVE",
        _id: { $nin: [freshFrom._id, freshTo._id] },
      }),
      Booking.findOne({
        lecturer: freshTo.lecturer,
        date: freshFrom.date,
        timeSlot: freshFrom.timeSlot,
        status: "ACTIVE",
        _id: { $nin: [freshFrom._id, freshTo._id] },
      }),
    ]);
    if (lecturerAConflict || lecturerBConflict) {
      return res.status(409).json({ message: "Swap would create a scheduling conflict for a lecturer" });
    }

    // Venue conflict check: swapping venue/time/lecturer combos must not
    // collide with any other active booking (only relevant if date differs
    // between the two bookings, since venues themselves are also swapping).
    if (freshFrom.date.getTime() !== freshTo.date.getTime() || !freshFrom.timeSlot.equals(freshTo.timeSlot)) {
      const [venueConflictA, venueConflictB] = await Promise.all([
        findConflictingBooking({
          venue: freshFrom.venue,
          timeSlot: freshTo.timeSlot,
          date: freshTo.date,
          excludeBookingId: freshFrom._id,
        }),
        findConflictingBooking({
          venue: freshTo.venue,
          timeSlot: freshFrom.timeSlot,
          date: freshFrom.date,
          excludeBookingId: freshTo._id,
        }),
      ]);
      if (venueConflictA || venueConflictB) {
        return res.status(409).json({ message: "Swap would create a venue conflict" });
      }
    }

    // All checks passed — perform the swap of venue+timeSlot+date+lecturer
    const swap = {
      venue: freshFrom.venue,
      timeSlot: freshFrom.timeSlot,
      date: freshFrom.date,
      lecturer: freshFrom.lecturer,
    };
    freshFrom.venue = freshTo.venue;
    freshFrom.timeSlot = freshTo.timeSlot;
    freshFrom.date = freshTo.date;
    freshFrom.lecturer = freshTo.lecturer;

    freshTo.venue = swap.venue;
    freshTo.timeSlot = swap.timeSlot;
    freshTo.date = swap.date;
    freshTo.lecturer = swap.lecturer;

    await freshFrom.save();
    await freshTo.save();

    exchange.status = "ACCEPTED";
    exchange.respondedAt = new Date();
    await exchange.save();

    await Promise.all([
      notify(freshFrom.lecturer, {
        title: "Exchange completed",
        message: `You are now teaching "${freshTo.title}" details`,
        type: "EXCHANGE",
      }),
      notify(freshTo.lecturer, {
        title: "Exchange completed",
        message: `You are now teaching "${freshFrom.title}" details`,
        type: "EXCHANGE",
      }),
    ]);

    res.json({ exchange, fromBooking: freshFrom, toBooking: freshTo });
  } catch (err) {
    next(err);
  }
};

exports.rejectExchange = async (req, res, next) => {
  try {
    const exchange = await ExchangeRequest.findById(req.params.id);
    if (!exchange) return res.status(404).json({ message: "Exchange not found" });
    if (!exchange.toLecturer.equals(req.user._id)) {
      return res.status(403).json({ message: "Only the invited lecturer can reject this" });
    }
    if (exchange.status !== "PENDING") {
      return res.status(400).json({ message: `Exchange already ${exchange.status.toLowerCase()}` });
    }
    exchange.status = "REJECTED";
    exchange.respondedAt = new Date();
    await exchange.save();

    await notify(exchange.fromLecturer, {
      title: "Exchange request declined",
      message: "Your exchange offer was declined",
      type: "EXCHANGE",
    });

    res.json(exchange);
  } catch (err) {
    next(err);
  }
};
