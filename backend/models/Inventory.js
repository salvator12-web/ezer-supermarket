const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    type: { type: String, enum: ["stock_in", "stock_out"], required: true },
    quantity: { type: Number, required: true, min: 1 },
    reason: { type: String, default: "" }, // e.g. "New delivery", "Order EZ-1004", "Damaged"
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    stockAfter: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inventory", inventorySchema);
