const router = require("express").Router();
const ctrl = require("../controllers/order.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

// Public checkout + tracking
router.post("/", ctrl.create);
router.get("/track/:orderId", ctrl.track);

// Rider views (specific paths before the generic admin list/:id routes)
router.get("/rider/available", requireAuth, requireRole("rider"), ctrl.riderAvailable);
router.get("/rider/active", requireAuth, requireRole("rider"), ctrl.riderActive);
router.get("/rider/history", requireAuth, requireRole("rider"), ctrl.riderHistory);

// Admin
router.get("/", requireAuth, requireRole("admin"), ctrl.list);
router.patch("/:id/status", requireAuth, requireRole("admin", "rider"), ctrl.updateStatus);
router.patch("/:id/assign", requireAuth, requireRole("admin", "rider"), ctrl.assignRider);

module.exports = router;
