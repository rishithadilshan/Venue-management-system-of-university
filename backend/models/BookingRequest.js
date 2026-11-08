const mongoose = require("mongoose");

const REQUEST_TYPES = [
  "CHANGE_TIME",
  "CHANGE_VENUE",
  "CHANGE_BOTH",
  "SPECIAL_LECTURE",
  "SPECIAL_PRACTICAL",
  "SPECIAL_STUDENT_EVENT",
];
const REQUEST_STATUS = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

const bookingRequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    requestType: { type: String, enum: REQUEST_TYPES, required: true },

    // Present for CHANGE_* requests against an existing regular booking.
    relatedBooking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },

    // What the requester wants. proposedVenue may be left blank for special
    // requests so Admin can pick from the available-venues search.
    proposedVenue: { type: mongoose.Schema.Types.ObjectId, ref: "Venue" },
    proposedTimeSlot: { type: mongoose.Schema.Types.ObjectId, ref: "TimeSlot" },
    proposedDate: { type: Date },

    eventTitle: { type: String, trim: true, default: "" },
    expectedStudents: { type: Number, min: 0 },
    requiredFacilities: [{ type: String, trim: true }],
    reason: { type: String, required: true, trim: true },

    status: { type: String, enum: REQUEST_STATUS, default: "PENDING" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewNote: { type: String, default: "" },
    resultingBooking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BookingRequest", bookingRequestSchema);
module.exports.REQUEST_TYPES = REQUEST_TYPES;
module.exports.REQUEST_STATUS = REQUEST_STATUS;
