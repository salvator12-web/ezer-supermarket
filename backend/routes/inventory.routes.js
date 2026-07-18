const router = require("express").Router();
const ctrl = require("../controllers/inventory.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

router.use(requireAuth, requireRole("admin"));

router.get("/", ctrl.overview);
router.get("/movements", ctrl.movements);
router.post("/stock-in", ctrl.stockIn);
router.post("/stock-out", ctrl.stockOut);

module.exports = router;
