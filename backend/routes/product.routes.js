const router = require("express").Router();
const ctrl = require("../controllers/product.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

router.get("/", ctrl.list);
router.get("/featured", ctrl.featured);
router.get("/:id", ctrl.getOne);
router.post("/", requireAuth, requireRole("admin"), ctrl.create);
router.put("/:id", requireAuth, requireRole("admin"), ctrl.update);
router.delete("/:id", requireAuth, requireRole("admin"), ctrl.remove);

module.exports = router;
