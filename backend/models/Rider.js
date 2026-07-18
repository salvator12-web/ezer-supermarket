const mongoose = require("mongoose");

const riderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    online: { type: Boolean, default: false },
    activeOrder: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    totalDeliveries: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 }, // sum of delivery fees collected, FRw
  },
  { timestamps: true }
);

module.exports = mongoose.model("Rider", riderSchema);
