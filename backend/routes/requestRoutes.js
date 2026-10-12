const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roleCheck");
const ctrl = require("../controllers/requestController");

router.use(protect);

router.get("/", ctrl.listRequests);
router.post("/", allowRoles("LECTURER", "STUDENT"), ctrl.createRequest);
router.patch("/:id/approve", allowRoles("ADMIN"), ctrl.approveRequest);
router.patch("/:id/reject", allowRoles("ADMIN"), ctrl.rejectRequest);
router.patch("/:id/cancel", ctrl.cancelRequest);

module.exports = router;
