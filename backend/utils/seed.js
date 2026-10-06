require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Venue = require("../models/Venue");
const TimeSlot = require("../models/TimeSlot");
const Department = require("../models/Department");
const Course = require("../models/Course");

const VENUES = [
  { name: "LT1", capacity: 250, type: "Lecture Hall", facilities: ["Projector", "AC"] },
  { name: "LT2", capacity: 250, type: "Lecture Hall", facilities: ["Projector", "AC"] },
  { name: "LR1", capacity: 150, type: "Lecture Hall", facilities: ["Projector"] },
  { name: "LR2", capacity: 150, type: "Lecture Hall", facilities: ["Projector"] },
  { name: "Auditorium", capacity: 550, type: "Auditorium", facilities: ["Projector", "AC", "Audio system"] },
  { name: "NCC", capacity: 300, type: "Laboratory", facilities: ["Computers", "AC"] },
  { name: "OCC", capacity: 200, type: "Laboratory", facilities: ["Computers", "AC"] },
  { name: "NLH1", capacity: 150, type: "Laboratory", facilities: ["Computers"] },
  { name: "NLH2", capacity: 150, type: "Laboratory", facilities: ["Computers"] },
  { name: "NLH3", capacity: 150, type: "Laboratory", facilities: ["Computers"] },
  { name: "ELR", capacity: 100, type: "Seminar Room", facilities: ["Projector"] },
];

const SLOTS = [
  { name: "Slot 1", startTime: "08:30", endTime: "09:30" },
  { name: "Slot 2", startTime: "09:30", endTime: "10:30" },
  { name: "Slot 3", startTime: "10:30", endTime: "11:30" },
  { name: "Slot 4", startTime: "11:30", endTime: "12:30" },
  { name: "Slot 5", startTime: "13:00", endTime: "14:00" },
  { name: "Slot 6", startTime: "14:00", endTime: "15:00" },
  { name: "Slot 7", startTime: "15:00", endTime: "16:00" },
  { name: "Slot 8", startTime: "16:00", endTime: "16:30" },
];

async function seed() {
  await connectDB();

  const dept = await Department.findOneAndUpdate(
    { name: "Computer Engineering" },
    { name: "Computer Engineering", code: "CE" },
    { upsert: true, new: true }
  );

  for (const v of VENUES) {
    await Venue.findOneAndUpdate({ name: v.name }, v, { upsert: true, new: true });
  }
  for (const s of SLOTS) {
    await TimeSlot.findOneAndUpdate({ name: s.name }, s, { upsert: true, new: true });
  }

  const adminEmail = "admin@uvms.local";
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: "System Admin",
      email: adminEmail,
      password: "Admin@123",
      role: "ADMIN",
    });
    console.log(`[seed] created admin -> ${adminEmail} / Admin@123 (change this password!)`);
  }

  let lecturer = await User.findOne({ email: "lecturer@uvms.local" });
  if (!lecturer) {
    lecturer = await User.create({
      name: "Dr. A. Perera",
      email: "lecturer@uvms.local",
      password: "Lecturer@123",
      role: "LECTURER",
      department: dept._id,
    });
    console.log("[seed] created lecturer -> lecturer@uvms.local / Lecturer@123");
  }

  let student = await User.findOne({ email: "student@uvms.local" });
  if (!student) {
    student = await User.create({
      name: "S. Fernando",
      email: "student@uvms.local",
      password: "Student@123",
      role: "STUDENT",
      department: dept._id,
    });
    console.log("[seed] created student -> student@uvms.local / Student@123");
  }

  let labAssistant = await User.findOne({ email: "lab@uvms.local" });
  if (!labAssistant) {
    labAssistant = await User.create({
      name: "N. Silva",
      email: "lab@uvms.local",
      password: "LabAssist@123",
      role: "LAB_ASSISTANT",
    });
    console.log("[seed] created lab assistant -> lab@uvms.local / LabAssist@123");
  }

  await Course.findOneAndUpdate(
    { name: "Computer Architecture" },
    { name: "Computer Architecture", code: "CE2010", department: dept._id, defaultLecturer: lecturer._id },
    { upsert: true, new: true }
  );

  console.log("[seed] done");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
