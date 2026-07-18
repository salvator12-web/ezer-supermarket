const Product = require("../models/Product");
const { CATEGORIES } = require("../models/Product");

// GET /api/products?category=&search=  (public)
async function list(req, res) {
  const { category, search } = req.query;
  const filter = {};
  if (category && category !== "all") filter.category = category;
  if (search) filter.name = { $regex: search, $options: "i" };
  const products = await Product.find(filter).sort({ name: 1 });
  res.json({ products, categories: CATEGORIES });
}

// GET /api/products/featured  (public, home page)
async function featured(req, res) {
  const products = await Product.find({ featured: true }).limit(8);
  res.json(products);
}

// GET /api/products/:id  (public)
async function getOne(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
}

// POST /api/products  (admin)
async function create(req, res) {
  const { name, category, price, stock, minStockLevel, icon, imageURL, description, featured: isFeatured } = req.body;
  if (!name || !category || price == null) {
    return res.status(400).json({ error: "name, category, and price are required" });
  }
  const product = await Product.create({
    name, category, price, stock: stock || 0, minStockLevel: minStockLevel || 10,
    icon, imageURL, description, featured: !!isFeatured,
  });
  res.status(201).json(product);
}

// PUT /api/products/:id  (admin)
async function update(req, res) {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
}

// DELETE /api/products/:id  (admin)
async function remove(req, res) {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json({ ok: true });
}

module.exports = { list, featured, getOne, create, update, remove };
