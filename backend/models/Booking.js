const mongoose = require("mongoose");

const BOOKING_TYPES = ["REGULAR", "SPECIAL"];
const BOOKING_STATUS = ["ACTIVE", "CANCELLED"];

const bookingSchema = new mongoose.Schema(
  {
    venue: { type: mongoose.Schema.Types.ObjectId, ref: "Venue", required: true },
    timeSlot: { type: mongoose.Schema.Types.ObjectId, ref: "TimeSlot", required: true },
    // Concrete calendar date. Weekly "regular" timetable entries are expanded
    // into one Booking document per date (grouped by seriesId) so conflict
    // detection is a single simple query regardless of how a booking was created.
    date: { type: Date, required: true },
    dayOfWeek: { type: Number, min: 0, max: 6 }, // 0 = Sunday, derived from date
    title: { type: String, required: true, trim: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    lecturer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    expectedStudents: { type: Number, required: true, min: 0 },
    type: { type: String, enum: BOOKING_TYPES, default: "REGULAR" },
    seriesId: { type: mongoose.Schema.Types.ObjectId }, // groups a recurring weekly series
    status: { type: String, enum: BOOKING_STATUS, default: "ACTIVE" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

bookingSchema.pre("validate", function (next) {
  if (this.date) {
    this.dayOfWeek = new Date(this.date).getUTCDay();
  }
  next();
});

// A venue cannot hold two active bookings in the same slot on the same date.
bookingSchema.index({ venue: 1, timeSlot: 1, date: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
module.exports.BOOKING_TYPES = BOOKING_TYPES;
module.exports.BOOKING_STATUS = BOOKING_STATUS;
