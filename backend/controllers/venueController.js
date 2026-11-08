const Venue = require("../models/Venue");
const { notifyMany } = require("../utils/notify");
const User = require("../models/User");

exports.listVenues = async (req, res, next) => {
  try {
    const { type, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    const venues = await Venue.find(filter).sort({ name: 1 });
    res.json(venues);
  } catch (err) {
    next(err);
  }
};

exports.getVenue = async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id).populate("managedBy", "name email");
    if (!venue) return res.status(404).json({ message: "Venue not found" });
    res.json(venue);
  } catch (err) {
    next(err);
  }
};

// Admin only
exports.createVenue = async (req, res, next) => {
  try {
    const { name, capacity, type, building, facilities, managedBy } = req.body;
    if (!name || !capacity) {
      return res.status(400).json({ message: "name and capacity are required" });
    }
    const venue = await Venue.create({ name, capacity, type, building, facilities, managedBy });
    res.status(201).json(venue);
  } catch (err) {
    next(err);
  }
};

// Admin only
exports.updateVenue = async (req, res, next) => {
  try {
    const venue = await Venue.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!venue) return res.status(404).json({ message: "Venue not found" });
    res.json(venue);
  } catch (err) {
    next(err);
  }
};

// Admin, or the Lab Assistant managing that venue, can flag it unavailable.
exports.setVenueStatus = async (req, res, next) => {
  try {
    const { status, maintenanceNote } = req.body;
    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ message: "Venue not found" });

    const isManager = venue.managedBy.some((id) => id.equals(req.user._id));
    if (req.user.role !== "ADMIN" && !(req.user.role === "LAB_ASSISTANT" && isManager)) {
      return res.status(403).json({ message: "You do not manage this venue" });
    }

    venue.status = status;
    venue.maintenanceNote = maintenanceNote || "";
    await venue.save();

    // Let admins know a venue went down (or came back up)
    const admins = await User.find({ role: "ADMIN" }).distinct("_id");
    await notifyMany(admins, {
      title: `Venue ${venue.name} marked ${status}`,
      message: maintenanceNote || `${req.user.name} updated the status of ${venue.name}`,
      type: "VENUE_STATUS",
      link: "/admin/venues",
    });

    res.json(venue);
  } catch (err) {
    next(err);
  }
};

exports.deleteVenue = async (req, res, next) => {
  try {
    const venue = await Venue.findByIdAndDelete(req.params.id);
    if (!venue) return res.status(404).json({ message: "Venue not found" });
    res.json({ message: "Venue deleted" });
  } catch (err) {
    next(err);
  }
};
