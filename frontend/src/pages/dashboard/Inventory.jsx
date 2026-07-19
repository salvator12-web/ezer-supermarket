import { useEffect, useState } from 'react';
import { api } from '../../utils/api.js';
import StockModal from './StockModal.jsx';
import './dashboard-ui.css';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'low', label: 'Low' },
  { key: 'critical', label: 'Critical' },
  { key: 'out', label: 'Out of stock' },
];

export default function Inventory() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null); // { product, mode }

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await api.get('/inventory');
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleStockSubmit({ productId, quantity, reason }) {
    const path = modal.mode === 'in' ? '/inventory/stock-in' : '/inventory/stock-out';
    const { product: updated } = await api.post(path, { productId, quantity, reason });
    setData((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p._id === updated._id ? updated : p)),
    }));
    setModal(null);
    load(); // refresh summary counts
  }

  if (loading) return <div className="dash-loading">Loading inventory…</div>;
  if (error) return <div className="dash-error">{error}</div>;

  const visible = data.products.filter((p) => filter === 'all' || p.stockStatus === filter);

  return (
    <div>
      <div className="dash-header">
        <h1>Inventory</h1>
        <p>Stock levels and movements across the catalog.</p>
      </div>

      <div className="dash-kpi-grid">
        <div className="dash-card">
          <div className="dash-kpi-label">In stock</div>
          <div className="dash-kpi-value">{data.summary.inStock}</div>
        </div>
        <div className="dash-card">
          <div className="dash-kpi-label">Low</div>
          <div className="dash-kpi-value warn">{data.summary.low}</div>
        </div>
        <div className="dash-card">
          <div className="dash-kpi-label">Critical</div>
          <div className="dash-kpi-value warn">{data.summary.critical}</div>
        </div>
        <div className="dash-card">
          <div className="dash-kpi-label">Out of stock</div>
          <div className="dash-kpi-value warn">{data.summary.out}</div>
        </div>
      </div>

      <div className="dash-toolbar">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`badge ${filter === f.key ? 'badge-accent' : 'badge-neutral'}`}
              style={{ border: 'none', cursor: 'pointer' }}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dash-card">
        {visible.length === 0 ? (
          <div className="dash-empty">No products in this filter.</div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr><th>Product</th><th>Category</th><th>Stock</th><th>Min level</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p._id}>
                    <td>{p.icon} {p.name}</td>
                    <td>{p.category}</td>
                    <td>{p.stock}</td>
                    <td>{p.minStockLevel}</td>
                    <td><StatusBadge status={p.stockStatus} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModal({ product: p, mode: 'in' })}>
                          + In
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModal({ product: p, mode: 'out' })}>
                          − Out
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

      {modal && (
        <StockModal
          product={modal.product}
          mode={modal.mode}
          onClose={() => setModal(null)}
          onSubmit={handleStockSubmit}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    in_stock: ['success', 'In Stock'],
    low: ['warn', 'Low'],
    critical: ['warn', 'Critical'],
    out: ['neutral', 'Out of Stock'],
  };
  const [variant, label] = map[status] || ['neutral', status];
  return <span className={`badge badge-${variant}`}>{label}</span>;
}
