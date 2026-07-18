const Order = require("../models/Order");
const Product = require("../models/Product");
const Rider = require("../models/Rider");
const { feeFromDistanceKm, getDistanceKm } = require("./delivery.controller");
const { notifyFreeRiders } = require("./notification.controller");
const { syncOrderToFirestore } = require("../utils/firestoreSync");

// POST /api/orders  (public — checkout)
// body: { customerName, customerPhone, deliveryAddress, items:[{productId,qty}], paymentMethod, momoPhone? }
async function create(req, res) {
  const { customerName, customerPhone, deliveryAddress, items, paymentMethod, momoPhone } = req.body;
  if (!customerName || !customerPhone || !deliveryAddress || !items?.length || !paymentMethod) {
    return res.status(400).json({ error: "customerName, customerPhone, deliveryAddress, items, and paymentMethod are required" });
  }
  if (paymentMethod === "momo" && !momoPhone) {
    return res.status(400).json({ error: "momoPhone is required for MoMo payments" });
  }

  // Look up products, lock in current price/name, check stock.
  const lineItems = [];
  let subtotal = 0;
  for (const line of items) {
    const product = await Product.findById(line.productId);
    if (!product) return res.status(404).json({ error: `Product ${line.productId} not found` });
    if (product.stock < line.qty) return res.status(409).json({ error: `${product.name} only has ${product.stock} in stock` });
    lineItems.push({ productId: product._id, name: product.name, qty: line.qty, price: product.price });
    subtotal += product.price * line.qty;
  }

  const distanceKm = await getDistanceKm(deliveryAddress);
  const deliveryFee = feeFromDistanceKm(distanceKm ?? 5);

  const order = await Order.create({
    customerName, customerPhone, deliveryAddress,
    items: lineItems, subtotal, distanceKm, deliveryFee, total: subtotal + deliveryFee,
    paymentMethod, momoPhone: paymentMethod === "momo" ? momoPhone : undefined,
    paymentStatus: paymentMethod === "cash" ? "unpaid" : "unpaid",
  });

  // Deduct stock immediately (reserved for this order).
  for (const line of lineItems) {
    await Product.findByIdAndUpdate(line.productId, { $inc: { stock: -line.qty } });
  }

  notifyFreeRiders(order).catch((err) => console.warn("notifyFreeRiders failed:", err.message));
  syncOrderToFirestore(order).catch(() => {}); // already logs internally

  res.status(201).json(order);
}

// GET /api/orders/:orderId  (public — track by EZ-XXXX id)
async function track(req, res) {
  const order = await Order.findOne({ orderId: req.params.orderId }).populate("rider", "name phone");
  if (!order) return res.status(404).json({ error: "Order not found - check the order ID" });
  res.json(order);
}

// GET /api/orders?status=  (admin)
async function list(req, res) {
  const { status } = req.query;
  const filter = {};
  if (status && status !== "all") filter.status = status;
  const orders = await Order.find(filter).sort({ createdAt: -1 }).populate("rider", "name phone");
  res.json(orders);
}

const STATUS_ORDER = ["pending", "accepted", "picked_up", "on_the_way", "delivered"];

// PATCH /api/orders/:id/status  { status }  (admin or assigned rider)
async function updateStatus(req, res) {
  const { status } = req.body;
  if (!["pending", "accepted", "picked_up", "on_the_way", "delivered", "cancelled"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  if (req.user.role === "rider" && String(order.rider) !== String(req.user.id)) {
    return res.status(403).json({ error: "This order is not assigned to you" });
  }

  order.status = status;
  await order.save();
  syncOrderToFirestore(order).catch(() => {});

  if (status === "delivered" && order.rider) {
    await Rider.findOneAndUpdate(
      { user: order.rider },
      { activeOrder: null, $inc: { totalDeliveries: 1, totalEarnings: order.deliveryFee } }
    );
  }

  res.json(order);
}

// PATCH /api/orders/:id/assign  { riderId }  (admin, or rider self-accepting)
async function assignRider(req, res) {
  const riderId = req.body.riderId || req.user.id; // riders self-assign from "Available orders"
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.rider) return res.status(409).json({ error: "Order already assigned" });

  const riderUser = await require("../models/User").findById(riderId);
  if (!riderUser || riderUser.role !== "rider") return res.status(400).json({ error: "Invalid rider" });

  order.rider = riderUser._id;
  order.riderName = riderUser.name;
  order.status = "accepted";
  await order.save();
  await Rider.findOneAndUpdate({ user: riderUser._id }, { activeOrder: order._id });
  syncOrderToFirestore(order).catch(() => {});

  res.json(order);
}

// GET /api/orders/rider/available  (rider — unassigned pending orders)
async function riderAvailable(req, res) {
  const myRider = await Rider.findOne({ user: req.user.id });
  if (myRider?.activeOrder) return res.json([]); // riders with an active delivery see none
  const orders = await Order.find({ status: "pending", rider: null }).sort({ createdAt: 1 });
  res.json(orders);
}

// GET /api/orders/rider/active  (rider — current delivery)
async function riderActive(req, res) {
  const order = await Order.findOne({ rider: req.user.id, status: { $in: ["accepted", "picked_up", "on_the_way"] } });
  res.json(order || null);
}

// GET /api/orders/rider/history  (rider — completed deliveries)
async function riderHistory(req, res) {
  const orders = await Order.find({ rider: req.user.id, status: "delivered" }).sort({ updatedAt: -1 });
  res.json(orders);
}

module.exports = { create, track, list, updateStatus, assignRider, riderAvailable, riderActive, riderHistory };
