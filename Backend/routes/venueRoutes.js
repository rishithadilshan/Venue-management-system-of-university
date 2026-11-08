const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roleCheck");
const ctrl = require("../controllers/venueController");

router.use(protect);

router.get("/", ctrl.listVenues);
router.get("/:id", ctrl.getVenue);
router.post("/", allowRoles("ADMIN"), ctrl.createVenue);
router.put("/:id", allowRoles("ADMIN"), ctrl.updateVenue);
router.delete("/:id", allowRoles("ADMIN"), ctrl.deleteVenue);
router.patch("/:id/status", allowRoles("ADMIN", "LAB_ASSISTANT"), ctrl.setVenueStatus);

module.exports = router;
