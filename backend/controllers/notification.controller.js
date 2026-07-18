const User = require("../models/User");
const Rider = require("../models/Rider");
const { firebaseMessaging } = require("../config/firebase");

// Sends "New order available" push to every rider who currently has no
// active delivery. Called internally right after a new order is created;
// also exposed as a route for manual re-triggering from the admin dashboard.
async function notifyFreeRiders(order) {
  const freeRiders = await Rider.find({ online: true, activeOrder: null }).populate("user");
  const tokens = freeRiders.map((r) => r.user?.fcmToken).filter(Boolean);
  if (!tokens.length) return { sent: 0 };

  const message = {
    notification: {
      title: "New Order — EZER Supermarket",
      body: `New delivery request (${order.orderId}). Tap to view.`,
    },
    data: { orderId: order.orderId, type: "new_order" },
    tokens,
  };

  try {
    const result = await firebaseMessaging().sendEachForMulticast(message);
    return { sent: result.successCount, failed: result.failureCount };
  } catch (err) {
    console.warn("FCM push failed (order still saved):", err.message);
    return { sent: 0, error: err.message };
  }
}

// POST /api/notifications/new-order/:orderId  (admin — manual retry)
async function retryNewOrderNotification(req, res) {
  const Order = require("../models/Order");
  const order = await Order.findOne({ orderId: req.params.orderId });
  if (!order) return res.status(404).json({ error: "Order not found" });
  const result = await notifyFreeRiders(order);
  res.json(result);
}

module.exports = { notifyFreeRiders, retryNewOrderNotification };
