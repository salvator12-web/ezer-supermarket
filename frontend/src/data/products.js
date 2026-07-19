// Static category list, kept in sync with backend/models/Product.js CATEGORIES
// so CategoryTabs can render before the first API response arrives.
// Real product data now comes from GET /api/products / GET /api/products/featured
// (see frontend/src/utils/mapProduct.js) — this file no longer holds mock products.
export const categories = [
  'Fresh Produce',
  'Bakery',
  'Dairy & Eggs',
  'Beverages',
  'Meat & Fish',
  'Grains & Staples',
  'Snacks & Confectionery',
  'Condiments & Sauces',
  'Personal Care',
  'Household & Cleaning',
  'Health & Baby',
];

// Stock status thresholds (per spec):
//   In Stock  > minStock * 2   Low <= minStock * 2   Critical <= minStock   Out === 0
export function getStockStatus(product) {
  const stock = product.stock ?? 0;
  const minStock = product.minStock ?? product.minStockLevel ?? 10;
  if (stock === 0) return 'outOfStock';
  if (stock <= minStock) return 'critical';
  if (stock <= minStock * 2) return 'lowStock';
  return 'inStock';
}
