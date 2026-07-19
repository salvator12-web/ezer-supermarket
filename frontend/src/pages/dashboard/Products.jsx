import { useEffect, useState, useMemo } from 'react';
import { api } from '../../utils/api.js';
import { formatFRw } from '../../utils/format.js';
import ProductModal from './ProductModal.jsx';
import './dashboard-ui.css';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalProduct, setModalProduct] = useState(undefined); // undefined = closed, null = new, object = edit

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { products: list } = await api.get('/products');
      setProducts(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [products, search]);

  async function handleSave(data) {
    if (modalProduct && modalProduct._id) {
      const updated = await api.put(`/products/${modalProduct._id}`, data);
      setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
    } else {
      const created = await api.post('/products', data);
      setProducts((prev) => [created, ...prev]);
    }
    setModalProduct(undefined);
  }

  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.name}"? This can't be undone.`)) return;
    try {
      await api.del(`/products/${product._id}`);
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="dash-header">
        <h1>Products</h1>
        <p>Manage the catalog customers see in the shop.</p>
      </div>

      <div className="dash-toolbar">
        <div className="dash-search">
          <i className="ti ti-search" aria-hidden="true" />
          <input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setModalProduct(null)}>
          <i className="ti ti-plus" aria-hidden="true" /> Add product
        </button>
      </div>

      {error && <div className="dash-error">{error}</div>}

      <div className="dash-card">
        {loading ? (
          <div className="dash-loading">Loading products…</div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty">No products match your search.</div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p._id}>
                    <td>{p.icon} {p.name}</td>
                    <td>{p.category}</td>
                    <td>{formatFRw(p.price)}</td>
                    <td>{p.stock}</td>
                    <td><StockBadge status={p.stockStatus} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button type="button" className="icon-btn" title="Edit" onClick={() => setModalProduct(p)}>
                          <i className="ti ti-pencil" aria-hidden="true" />
                        </button>
                        <button type="button" className="icon-btn danger" title="Delete" onClick={() => handleDelete(p)}>
                          <i className="ti ti-trash" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalProduct !== undefined && (
        <ProductModal product={modalProduct} onClose={() => setModalProduct(undefined)} onSave={handleSave} />
      )}
    </div>
  );
}

function StockBadge({ status }) {
  const map = {
    in_stock: ['success', 'In Stock'],
    low: ['warn', 'Low'],
    critical: ['warn', 'Critical'],
    out: ['neutral', 'Out of Stock'],
  };
  const [variant, label] = map[status] || ['neutral', status];
  return <span className={`badge badge-${variant}`}>{label}</span>;
}
