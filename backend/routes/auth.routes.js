const router = require("express").Router();
const ctrl = require("../controllers/auth.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

router.get("/me", requireAuth, ctrl.me);
router.get("/staff", requireAuth, requireRole("admin"), ctrl.listStaff);
router.post("/staff", requireAuth, requireRole("admin"), ctrl.createStaff);
router.patch("/staff/:id/status", requireAuth, requireRole("admin"), ctrl.setStaffStatus);
router.put("/fcm-token", requireAuth, requireRole("rider"), ctrl.setFcmToken);

module.exports = router;
