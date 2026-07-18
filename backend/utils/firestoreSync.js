const { firestore } = require("../config/firebase");

// Firestore only ever holds the small slice of an order needed to drive a
// live status UI (Track page, rider Active page) — never customer contact
// info or item details, so a public/anon Firestore read rule on this
// collection stays low-risk. Full order details still come from MongoDB via
// the REST API (GET /api/orders/:orderId), which the frontend fetches once
// on load; this mirror just keeps `status`/`riderName` current after that.
//
// Never throws — a Firestore hiccup should never fail an order create/update,
// it just means that one client falls back to the polling it already had
// before Phase 5B (or simply doesn't get a live update until the next
// successful sync).
async function syncOrderToFirestore(order) {
  try {
    await firestore()
      .collection("orders")
      .doc(order.orderId)
      .set(
        {
          orderId: order.orderId,
          status: order.status,
          riderName: order.riderName || null,
          paymentStatus: order.paymentStatus,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
  } catch (err) {
    console.warn(`Firestore sync failed for ${order.orderId} (order still saved in MongoDB):`, err.message);
  }
}

module.exports = { syncOrderToFirestore };
