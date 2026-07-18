const User = require("../models/User");
const Rider = require("../models/Rider");

// GET /api/auth/me — called after Firebase sign-in to fetch role + profile
async function me(req, res) {
  const user = await User.findById(req.user.id).select("-__v");
  res.json(user);
}

// GET /api/auth/staff?role=  — admin lists staff accounts (used by Orders page
// to populate the "assign rider" dropdown with active riders)
async function listStaff(req, res) {
  const { role } = req.query;
  const filter = {};
  if (role) filter.role = role;
  const staff = await User.find(filter).sort({ name: 1 }).select("-__v");
  res.json(staff);
}

// POST /api/auth/staff — admin creates a new staff account (admin or rider)
// The account must already exist in Firebase Auth (created via Firebase console
// or a separate admin-only Firebase Admin SDK call) — this just links it in Mongo.
async function createStaff(req, res) {
  const { name, email, phone, role, branch } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ error: "name, email, and role are required" });
  }
  if (!["admin", "rider"].includes(role)) {
    return res.status(400).json({ error: "role must be admin or rider" });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ error: "A staff account with this email already exists" });

  const user = await User.create({ name, email: email.toLowerCase(), phone, role, branch });
  if (role === "rider") await Rider.create({ user: user._id });

  res.status(201).json(user);
}

// PATCH /api/auth/staff/:id/status — admin activates/deactivates a staff account
async function setStaffStatus(req, res) {
  const { status } = req.body;
  if (!["active", "inactive"].includes(status)) {
    return res.status(400).json({ error: "status must be active or inactive" });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!user) return res.status(404).json({ error: "Staff account not found" });
  res.json(user);
}

// PUT /api/auth/fcm-token — rider registers their device token for push notifications
async function setFcmToken(req, res) {
  const { fcmToken } = req.body;
  await User.findByIdAndUpdate(req.user.id, { fcmToken });
  res.json({ ok: true });
}

module.exports = { me, listStaff, createStaff, setStaffStatus, setFcmToken };
