const router = require("express").Router();
const ctrl = require("../controllers/stats.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

router.use(requireAuth, requireRole("admin"));

router.get("/overview", ctrl.overview);
router.get("/revenue", ctrl.revenueByMonth);

module.exports = router;
