const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String },
    role: { type: String, enum: ["admin", "rider"], required: true },
    branch: { type: String, default: "Kigali" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    fcmToken: { type: String, default: null }, // for push notifications (riders)
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
