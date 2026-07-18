const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true }, // EZ-XXXX, set in pre-save hook
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    deliveryAddress: { type: String, required: true },

    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        qty: Number,
        price: Number,
      },
    ],
    subtotal: { type: Number, required: true },
    distanceKm: { type: Number, default: null },
    deliveryFee: { type: Number, required: true },
    total: { type: Number, required: true },

    paymentMethod: { type: String, enum: ["momo", "cash"], required: true },
    paymentStatus: { type: String, enum: ["unpaid", "pending", "paid"], default: "unpaid" },
    momoPhone: { type: String, default: null },
    momoReferenceId: { type: String, default: null },

    status: {
      type: String,
      enum: ["pending", "accepted", "picked_up", "on_the_way", "delivered", "cancelled"],
      default: "pending",
    },
    rider: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    riderName: { type: String, default: null },
    estimatedDeliveryTime: { type: Date, default: null },

    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

orderSchema.pre("save", async function (next) {
  if (!this.orderId) {
    const count = await mongoose.model("Order").countDocuments();
    this.orderId = `EZ-${String(count + 1001).padStart(4, "0")}`;
  }
  if (this.isModified("status")) {
    this.statusHistory.push({ status: this.status, timestamp: new Date() });
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
