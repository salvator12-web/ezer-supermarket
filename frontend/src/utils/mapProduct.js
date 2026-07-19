// Normalizes a Product document coming back from GET /api/products (Mongo
// shape: _id, minStockLevel) into the flat shape the cart/shop components
// were built against in Phase 2 (id, minStock). Keeps every other field
// (name, category, icon, price, stock, featured, imageURL, description) as-is.
export function mapProduct(doc) {
  if (!doc) return doc;
  return {
    ...doc,
    id: doc._id,
    minStock: doc.minStockLevel,
  };
}

export function mapProducts(docs) {
  return (docs || []).map(mapProduct);
}
