const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "ALLOCATION",
        "REQUEST_UPDATE",
        "EXCHANGE",
        "SCHEDULE_CHANGE",
        "VENUE_STATUS",
        "GENERAL",
      ],
      default: "GENERAL",
    },
    read: { type: Boolean, default: false },
    link: { type: String, default: "" }, // frontend route hint, e.g. /schedule
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
