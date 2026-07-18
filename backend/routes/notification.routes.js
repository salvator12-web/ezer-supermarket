const router = require("express").Router();
const ctrl = require("../controllers/notification.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

router.post("/new-order/:orderId", requireAuth, requireRole("admin"), ctrl.retryNewOrderNotification);

module.exports = router;
