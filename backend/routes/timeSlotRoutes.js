const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roleCheck");
const ctrl = require("../controllers/timeSlotController");

router.use(protect);

router.get("/", ctrl.listTimeSlots);
router.post("/", allowRoles("ADMIN"), ctrl.createTimeSlot);
router.put("/:id", allowRoles("ADMIN"), ctrl.updateTimeSlot);
router.delete("/:id", allowRoles("ADMIN"), ctrl.deleteTimeSlot);

module.exports = router;
