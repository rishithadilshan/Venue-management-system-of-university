const mongoose = require("mongoose");

// Stored as "HH:MM" 24-hour strings so admin can edit them without a redeploy.
const timeSlotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Slot 1"
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

timeSlotSchema.pre("validate", function (next) {
  if (this.startTime && this.endTime && this.startTime >= this.endTime) {
    return next(new Error("startTime must be earlier than endTime"));
  }
  next();
});

module.exports = mongoose.model("TimeSlot", timeSlotSchema);
