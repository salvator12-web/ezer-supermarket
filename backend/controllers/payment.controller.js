const axios = require("axios");
const { randomUUID } = require("crypto");
const Order = require("../models/Order");

function momoBaseUrl() {
  return process.env.MOMO_ENVIRONMENT === "production"
    ? "https://momodeveloper.mtn.com"
    : "https://sandbox.momodeveloper.mtn.com";
}

// Requests an access token from MTN's Collections API using MOMO_API_USER / MOMO_API_KEY.
async function getMomoToken() {
  const { MOMO_SUBSCRIPTION_KEY, MOMO_API_USER, MOMO_API_KEY } = process.env;
  if (!MOMO_SUBSCRIPTION_KEY || !MOMO_API_USER || !MOMO_API_KEY) {
    throw new Error("MTN MoMo credentials not configured (MOMO_SUBSCRIPTION_KEY / MOMO_API_USER / MOMO_API_KEY)");
  }
  const auth = Buffer.from(`${MOMO_API_USER}:${MOMO_API_KEY}`).toString("base64");
  const { data } = await axios.post(
    `${momoBaseUrl()}/collection/token/`,
    {},
    { headers: { Authorization: `Basic ${auth}`, "Ocp-Apim-Subscription-Key": MOMO_SUBSCRIPTION_KEY } }
  );
  return data.access_token;
}

// Triggers a Request to Pay (USSD push) to the customer's MTN phone.
// referenceId is a UUID that both identifies this transaction to MTN
// and doubles as our lookup key for the callback.
async function requestToPay({ amount, phone, orderId }) {
  const referenceId = randomUUID();
  const token = await getMomoToken();
  const { MOMO_SUBSCRIPTION_KEY } = process.env;

  await axios.post(
    `${momoBaseUrl()}/collection/v1_0/requesttopay`,
    {
      amount: String(amount),
      currency: "RWF",
      externalId: orderId,
      payer: { partyIdType: "MSISDN", partyId: phone.replace(/\D/g, "") },
      payerMessage: `EZER Supermarket order ${orderId}`,
      payeeNote: "EZER Supermarket",
    },
    {
      headers: {
        "X-Reference-Id": referenceId,
        "X-Target-Environment": process.env.MOMO_ENVIRONMENT || "sandbox",
        "Ocp-Apim-Subscription-Key": MOMO_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return referenceId;
}

// POST /api/payment/momo/request  { orderId }  (public — called right after order creation)
async function momoRequest(req, res) {
  const { orderId } = req.body;
  const order = await Order.findOne({ orderId });
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.paymentMethod !== "momo") return res.status(400).json({ error: "Order is not a MoMo order" });

  try {
    const referenceId = await requestToPay({ amount: order.total, phone: order.momoPhone, orderId: order.orderId });
    order.momoReferenceId = referenceId;
    order.paymentStatus = "pending";
    await order.save();
    res.json({ ok: true, referenceId, message: "USSD push sent - ask the customer to confirm on their phone" });
  } catch (err) {
    res.status(502).json({ error: "Could not reach MTN MoMo", detail: err.message });
  }
}

// POST /api/payment/momo/callback  — MTN calls this when the customer confirms/declines
async function momoCallback(req, res) {
  // MTN's callback payload shape varies by API version; adapt this once the
  // sandbox/production callback URL is registered and a real payload is seen.
  const { referenceId, status } = req.body;
  const order = await Order.findOne({ momoReferenceId: referenceId });
  if (!order) return res.status(404).json({ error: "No matching order for this referenceId" });

  order.paymentStatus = status === "SUCCESSFUL" ? "paid" : "unpaid";
  await order.save();
  res.json({ ok: true });
}

// PATCH /api/payment/:orderId/mark-paid  (admin — cash on delivery confirmation)
async function markCashPaid(req, res) {
  const order = await Order.findOne({ orderId: req.params.orderId });
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.paymentMethod !== "cash") return res.status(400).json({ error: "Order is not a cash order" });
  order.paymentStatus = "paid";
  await order.save();
  res.json(order);
}

module.exports = { momoRequest, momoCallback, markCashPaid, requestToPay };
