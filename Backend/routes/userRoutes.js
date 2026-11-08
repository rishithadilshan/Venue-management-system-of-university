const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roleCheck");
const ctrl = require("../controllers/userController");

router.use(protect, allowRoles("ADMIN"));

router.get("/", ctrl.listUsers);
router.post("/", ctrl.createUser);
router.put("/:id", ctrl.updateUser);
router.delete("/:id", ctrl.deleteUser);

module.exports = router;
