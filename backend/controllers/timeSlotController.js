const TimeSlot = require("../models/TimeSlot");

exports.listTimeSlots = async (req, res, next) => {
  try {
    const { activeOnly } = req.query;
    const filter = activeOnly === "true" ? { active: true } : {};
    const slots = await TimeSlot.find(filter).sort({ startTime: 1 });
    res.json(slots);
  } catch (err) {
    next(err);
  }
};

exports.createTimeSlot = async (req, res, next) => {
  try {
    const { name, startTime, endTime, active } = req.body;
    if (!name || !startTime || !endTime) {
      return res.status(400).json({ message: "name, startTime and endTime are required" });
    }
    const slot = await TimeSlot.create({ name, startTime, endTime, active });
    res.status(201).json(slot);
  } catch (err) {
    next(err);
  }
};

exports.updateTimeSlot = async (req, res, next) => {
  try {
    const slot = await TimeSlot.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!slot) return res.status(404).json({ message: "Time slot not found" });
    res.json(slot);
  } catch (err) {
    next(err);
  }
};

exports.deleteTimeSlot = async (req, res, next) => {
  try {
    const slot = await TimeSlot.findByIdAndDelete(req.params.id);
    if (!slot) return res.status(404).json({ message: "Time slot not found" });
    res.json({ message: "Time slot deleted" });
  } catch (err) {
    next(err);
  }
};
