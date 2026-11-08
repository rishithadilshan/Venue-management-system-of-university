const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roleCheck");
const ctrl = require("../controllers/exchangeController");

router.use(protect, allowRoles("LECTURER"));

router.get("/", ctrl.listExchanges);
router.post("/", ctrl.createExchange);
router.patch("/:id/accept", ctrl.acceptExchange);
router.patch("/:id/reject", ctrl.rejectExchange);

module.exports = router;
