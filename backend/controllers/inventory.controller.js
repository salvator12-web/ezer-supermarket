const Product = require("../models/Product");
const Inventory = require("../models/Inventory");

// GET /api/inventory  (admin — stock levels + summary counts)
async function overview(req, res) {
  const products = await Product.find().sort({ name: 1 });
  const summary = products.reduce(
    (acc, p) => {
      if (p.stock === 0) acc.out++;
      else if (p.stock <= p.minStockLevel) acc.critical++;
      else if (p.stock <= p.minStockLevel * 2) acc.low++;
      else acc.inStock++;
      return acc;
    },
    { total: products.length, inStock: 0, low: 0, critical: 0, out: 0 }
  );
  res.json({ summary, products });
}

// GET /api/inventory/movements?productId=  (admin)
async function movements(req, res) {
  const filter = req.query.productId ? { product: req.query.productId } : {};
  const logs = await Inventory.find(filter).sort({ createdAt: -1 }).limit(200).populate("product", "name");
  res.json(logs);
}

// POST /api/inventory/stock-in  { productId, quantity, reason }  (admin)
async function stockIn(req, res) {
  const { productId, quantity, reason } = req.body;
  if (!productId || !quantity || quantity <= 0) return res.status(400).json({ error: "productId and a positive quantity are required" });

  const product = await Product.findByIdAndUpdate(productId, { $inc: { stock: quantity } }, { new: true });
  if (!product) return res.status(404).json({ error: "Product not found" });

  const log = await Inventory.create({
    product: productId, type: "stock_in", quantity, reason, performedBy: req.user.id, stockAfter: product.stock,
  });
  res.status(201).json({ product, log });
}

// POST /api/inventory/stock-out  { productId, quantity, reason }  (admin)
async function stockOut(req, res) {
  const { productId, quantity, reason } = req.body;
  if (!productId || !quantity || quantity <= 0) return res.status(400).json({ error: "productId and a positive quantity are required" });

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ error: "Product not found" });
  if (product.stock < quantity) return res.status(409).json({ error: `Only ${product.stock} in stock` });

  product.stock -= quantity;
  await product.save();

  const log = await Inventory.create({
    product: productId, type: "stock_out", quantity, reason, performedBy: req.user.id, stockAfter: product.stock,
  });
  res.status(201).json({ product, log });
}

module.exports = { overview, movements, stockIn, stockOut };
