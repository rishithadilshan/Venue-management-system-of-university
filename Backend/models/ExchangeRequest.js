const mongoose = require("mongoose");

const EXCHANGE_STATUS = ["PENDING", "ACCEPTED", "REJECTED", "CANCELLED"];

const exchangeRequestSchema = new mongoose.Schema(
  {
    fromLecturer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fromBooking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    toLecturer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    toBooking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    reason: { type: String, default: "" },
    status: { type: String, enum: EXCHANGE_STATUS, default: "PENDING" },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExchangeRequest", exchangeRequestSchema);
module.exports.EXCHANGE_STATUS = EXCHANGE_STATUS;
