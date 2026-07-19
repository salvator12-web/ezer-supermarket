import { useState } from 'react';

export default function StockModal({ product, mode, onClose, onSubmit }) {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isIn = mode === 'in';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError('Enter a quantity greater than 0.');
      return;
    }
    if (!isIn && qty > product.stock) {
      setError(`Only ${product.stock} in stock.`);
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ productId: product._id, quantity: qty, reason });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          {isIn ? 'Stock in' : 'Stock out'} — {product.icon} {product.name}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: '16px' }}>
          Current stock: <strong>{product.stock}</strong>
        </p>

        {error && <div className="dash-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="qty">Quantity</label>
            <input
              id="qty"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="reason">Reason (optional)</label>
            <input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isIn ? 'e.g. New delivery' : 'e.g. Damaged, expired'}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isIn ? 'Add stock' : 'Remove stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
