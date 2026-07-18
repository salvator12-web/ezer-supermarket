const router = require("express").Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const { createUploadSignature } = require("../config/cloudinary");

// POST /api/media/sign  (admin) — short-lived signature for a direct-to-Cloudinary upload
router.post("/sign", requireAuth, requireRole("admin"), (req, res) => {
  try {
    const signature = createUploadSignature("ezer-products");
    res.json(signature);
  } catch (err) {
    console.error("Cloudinary signature error:", err);
    res.status(500).json({ error: "Cloudinary is not configured on the server" });
  }
});

module.exports = router;
