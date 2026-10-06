const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roleCheck");
const ctrl = require("../controllers/bookingController");

router.use(protect);

router.get("/schedule", ctrl.getSchedule);
router.get("/my-schedule", allowRoles("LECTURER"), ctrl.getMySchedule);
router.get("/availability", ctrl.searchAvailability);

router.post("/", allowRoles("ADMIN"), ctrl.createBooking);
router.patch("/:id/override", allowRoles("ADMIN"), ctrl.overrideBooking);
router.delete("/:id", allowRoles("ADMIN", "LECTURER"), ctrl.cancelBooking);

module.exports = router;
