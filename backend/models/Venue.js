const mongoose = require("mongoose");

const VENUE_TYPES = ["Lecture Hall", "Laboratory", "Auditorium", "Seminar Room"];
const VENUE_STATUS = ["available", "maintenance", "disabled"];

const venueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    type: { type: String, enum: VENUE_TYPES, default: "Lecture Hall" },
    building: { type: String, trim: true, default: "" },
    facilities: [{ type: String, trim: true }],
    status: { type: String, enum: VENUE_STATUS, default: "available" },
    // Lab assistants can be linked to laboratories they oversee
    managedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    maintenanceNote: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Venue", venueSchema);
module.exports.VENUE_TYPES = VENUE_TYPES;
module.exports.VENUE_STATUS = VENUE_STATUS;
