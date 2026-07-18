const router = require("express").Router();
const ctrl = require("../controllers/payment.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

router.post("/momo/request", ctrl.momoRequest); // public — right after checkout
router.post("/momo/callback", ctrl.momoCallback); // called by MTN, not the frontend
router.patch("/:orderId/mark-paid", requireAuth, requireRole("admin"), ctrl.markCashPaid);

module.exports = router;
