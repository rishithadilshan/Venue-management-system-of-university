const Department = require("../models/Department");
const Course = require("../models/Course");

exports.listDepartments = async (req, res, next) => {
  try {
    res.json(await Department.find().sort({ name: 1 }));
  } catch (err) {
    next(err);
  }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    if (!name) return res.status(400).json({ message: "name is required" });
    res.status(201).json(await Department.create({ name, code }));
  } catch (err) {
    next(err);
  }
};

exports.listCourses = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    res.json(await Course.find(filter).populate("department defaultLecturer", "name code email").sort({ name: 1 }));
  } catch (err) {
    next(err);
  }
};

exports.createCourse = async (req, res, next) => {
  try {
    const { name, code, department, defaultLecturer } = req.body;
    if (!name) return res.status(400).json({ message: "name is required" });
    res.status(201).json(await Course.create({ name, code, department, defaultLecturer }));
  } catch (err) {
    next(err);
  }
};
