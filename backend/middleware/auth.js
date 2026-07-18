const { firebaseAuth } = require("../config/firebase");
const User = require("../models/User");

// Verifies the Firebase ID token sent as "Authorization: Bearer <token>"
// by the staff (admin/rider) frontend after Firebase Auth sign-in.
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing auth token" });

    const decoded = await firebaseAuth().verifyIdToken(token);
    const user = await User.findOne({ email: decoded.email });
    if (!user) return res.status(401).json({ error: "No matching staff account" });
    if (user.status !== "active") return res.status(403).json({ error: "Account disabled" });

    req.user = { id: user._id, email: user.email, role: user.role, branch: user.branch };
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token", detail: err.message });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Insufficient role" });
    next();
  };
}

module.exports = { requireAuth, requireRole };
