const Order = require("../models/Order");
const Product = require("../models/Product");

// GET /api/stats/overview  (admin)
async function overview(req, res) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [ordersThisMonth, revenueAgg, totalProducts, lowStock, recentOrders, bestSellersAgg] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: monthStart }, status: { $ne: "cancelled" } }),
    Order.aggregate([
      { $match: { createdAt: { $gte: monthStart }, status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Product.countDocuments(),
    Product.countDocuments({ $expr: { $lte: ["$stock", "$minStockLevel"] } }),
    Order.find().sort({ createdAt: -1 }).limit(8),
    Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.name", revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } }, unitsSold: { $sum: "$items.qty" } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
  ]);

  res.json({
    revenueThisMonth: revenueAgg[0]?.total || 0,
    ordersThisMonth,
    totalProducts,
    lowStockAlerts: lowStock,
    recentOrders,
    bestSellers: bestSellersAgg,
  });
}

// GET /api/stats/revenue  (admin — last 6 months, for the bar chart)
async function revenueByMonth(req, res) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const rows = await Order.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $ne: "cancelled" } } },
    { $group: { _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } }, total: { $sum: "$total" } } },
    { $sort: { "_id.y": 1, "_id.m": 1 } },
  ]);

  res.json(rows.map((r) => ({ year: r._id.y, month: r._id.m, total: r.total })));
}

module.exports = { overview, revenueByMonth };
