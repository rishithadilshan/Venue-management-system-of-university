const mongoose = require("mongoose");
const BookingRequest = require("../models/BookingRequest");
const Booking = require("../models/Booking");
const User = require("../models/User");
const { validateBooking, normalizeDate } = require("../utils/conflictDetection");
const { notify, notifyMany } = require("../utils/notify");

// Lecturer or Student creates a request.
exports.createRequest = async (req, res, next) => {
  try {
    const {
      requestType,
      relatedBooking,
      proposedVenue,
      proposedTimeSlot,
      proposedDate,
      eventTitle,
      expectedStudents,
      requiredFacilities,
      reason,
    } = req.body;

    if (!requestType || !reason) {
      return res.status(400).json({ message: "requestType and reason are required" });
    }

    // Students may only raise special-event requests.
    if (req.user.role === "STUDENT" && requestType !== "SPECIAL_STUDENT_EVENT") {
      return res.status(403).json({ message: "Students can only request special events" });
    }
    // Lecturers use the other request types.
    if (req.user.role === "LECTURER" && requestType === "SPECIAL_STUDENT_EVENT") {
      return res.status(403).json({ message: "Invalid request type for lecturers" });
    }

    if (["CHANGE_TIME", "CHANGE_VENUE", "CHANGE_BOTH"].includes(requestType)) {
      const booking = relatedBooking && (await Booking.findById(relatedBooking));
      if (!booking) return res.status(400).json({ message: "relatedBooking is required and must exist" });
      if (!booking.lecturer?.equals(req.user._id)) {
        return res.status(403).json({ message: "You can only request changes to your own lectures" });
      }
    }

    const request = await BookingRequest.create({
      requester: req.user._id,
      requestType,
      relatedBooking,
      proposedVenue,
      proposedTimeSlot,
      proposedDate,
      eventTitle,
      expectedStudents,
      requiredFacilities,
      reason,
    });

    const admins = await User.find({ role: "ADMIN" }).distinct("_id");
    await notifyMany(admins, {
      title: "New request awaiting review",
      message: `${req.user.name} submitted a ${requestType.replace(/_/g, " ").toLowerCase()} request`,
      type: "REQUEST_UPDATE",
      link: "/admin/requests",
    });

    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
};

exports.listRequests = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role !== "ADMIN") filter.requester = req.user._id;
    if (req.query.status) filter.status = req.query.status;

    const requests = await BookingRequest.find(filter)
      .populate("requester", "name email role")
      .populate("relatedBooking")
      .populate("proposedVenue", "name capacity")
      .populate("proposedTimeSlot", "name startTime endTime")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    next(err);
  }
};

// Admin approves: applies the change / creates the special booking.
exports.approveRequest = async (req, res, next) => {
  try {
    const { venue, timeSlot, date, reviewNote } = req.body; // admin's final choice
    const request = await BookingRequest.findById(req.params.id)
      .populate("relatedBooking")
      .populate("requester", "name role");
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "PENDING") {
      return res.status(400).json({ message: `Request already ${request.status.toLowerCase()}` });
    }

    const finalVenue = venue || request.proposedVenue;
    const finalTimeSlot = timeSlot || request.proposedTimeSlot;
    const finalDate = date || request.proposedDate;

    if (["CHANGE_TIME", "CHANGE_VENUE", "CHANGE_BOTH"].includes(request.requestType)) {
      const booking = request.relatedBooking;
      if (!booking) return res.status(400).json({ message: "Related booking no longer exists" });

      const check = await validateBooking({
        venue: finalVenue || booking.venue,
        timeSlot: finalTimeSlot || booking.timeSlot,
        date: finalDate || booking.date,
        expectedStudents: booking.expectedStudents,
        excludeBookingId: booking._id,
      });
      if (!check.ok) return res.status(409).json({ message: check.reason });

      if (finalVenue) booking.venue = finalVenue;
      if (finalTimeSlot) booking.timeSlot = finalTimeSlot;
      if (finalDate) booking.date = normalizeDate(finalDate);
      await booking.save();

      request.resultingBooking = booking._id;
      await notify(booking.lecturer, {
        title: "Your change request was approved",
        message: `"${booking.title}" has been updated`,
        type: "REQUEST_UPDATE",
        link: "/lecturer/schedule",
      });
    } else {
      // SPECIAL_LECTURE / SPECIAL_PRACTICAL / SPECIAL_STUDENT_EVENT
      if (!finalVenue || !finalTimeSlot || !finalDate) {
        return res.status(400).json({ message: "venue, timeSlot and date are required to approve" });
      }
      const check = await validateBooking({
        venue: finalVenue,
        timeSlot: finalTimeSlot,
        date: finalDate,
        expectedStudents: request.expectedStudents || 0,
      });
      if (!check.ok) return res.status(409).json({ message: check.reason });

      const booking = await Booking.create({
        venue: finalVenue,
        timeSlot: finalTimeSlot,
        date: normalizeDate(finalDate),
        title: request.eventTitle || "Special event",
        lecturer: request.requester.role === "LECTURER" ? request.requester._id : undefined,
        expectedStudents: request.expectedStudents || 0,
        type: "SPECIAL",
        createdBy: req.user._id,
        notes: request.reason,
      });
      request.resultingBooking = booking._id;

      await notify(request.requester._id, {
        title: "Your special venue request was approved",
        message: `"${booking.title}" confirmed for ${booking.date.toDateString()}`,
        type: "REQUEST_UPDATE",
        link: "/schedule",
      });
    }

    request.status = "APPROVED";
    request.reviewedBy = req.user._id;
    request.reviewNote = reviewNote || "";
    await request.save();

    res.json(request);
  } catch (err) {
    next(err);
  }
};

exports.rejectRequest = async (req, res, next) => {
  try {
    const { reviewNote } = req.body;
    const request = await BookingRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "PENDING") {
      return res.status(400).json({ message: `Request already ${request.status.toLowerCase()}` });
    }

    request.status = "REJECTED";
    request.reviewedBy = req.user._id;
    request.reviewNote = reviewNote || "";
    await request.save();

    await notify(request.requester, {
      title: "Your request was rejected",
      message: reviewNote || "See admin for details",
      type: "REQUEST_UPDATE",
    });

    res.json(request);
  } catch (err) {
    next(err);
  }
};

exports.cancelRequest = async (req, res, next) => {
  try {
    const request = await BookingRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (!request.requester.equals(req.user._id)) {
      return res.status(403).json({ message: "You can only cancel your own requests" });
    }
    if (request.status !== "PENDING") {
      return res.status(400).json({ message: "Only pending requests can be cancelled" });
    }
    request.status = "CANCELLED";
    await request.save();
    res.json(request);
  } catch (err) {
    next(err);
  }
};
