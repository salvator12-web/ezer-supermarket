const mongoose = require("mongoose");

const CATEGORIES = [
  "Fresh Produce",
  "Bakery",
  "Dairy & Eggs",
  "Beverages",
  "Meat & Fish",
  "Grains & Staples",
  "Snacks & Confectionery",
  "Condiments & Sauces",
  "Personal Care",
  "Household & Cleaning",
  "Health & Baby",
];

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: "🛒" }, // emoji icon, or swap for imageURL below
    imageURL: { type: String, default: "" }, // Cloudinary secure_url, folder: ezer-products (see backend/config/cloudinary.js)
    category: { type: String, enum: CATEGORIES, required: true },
    price: { type: Number, required: true, min: 0 }, // FRw
    stock: { type: Number, required: true, min: 0, default: 0 },
    minStockLevel: { type: Number, default: 10 },
    description: { type: String, default: "" },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.virtual("stockStatus").get(function () {
  if (this.stock === 0) return "out";
  if (this.stock <= this.minStockLevel) return "critical";
  if (this.stock <= this.minStockLevel * 2) return "low";
  return "in_stock";
});
productSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);
module.exports.CATEGORIES = CATEGORIES;
