const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roleCheck");
const ctrl = require("../controllers/miscController");

router.use(protect);

router.get("/departments", ctrl.listDepartments);
router.post("/departments", allowRoles("ADMIN"), ctrl.createDepartment);
router.get("/courses", ctrl.listCourses);
router.post("/courses", allowRoles("ADMIN"), ctrl.createCourse);

module.exports = router;
