import { useEffect, useState, useMemo } from 'react';
import { api } from '../../utils/api.js';
import { formatFRw } from '../../utils/format.js';
import './rider-ui.css';

export default function History() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const list = await api.get('/orders/rider/history');
        if (!cancelled) setOrders(list);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const totalEarnings = useMemo(
    () => orders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0),
    [orders]
  );

  if (loading) return <div className="rider-loading">Loading history…</div>;
  if (error) return <div className="dash-error">{error}</div>;

  return (
    <div>
      {orders.length > 0 && (
        <div className="earnings-banner">
          <div style={{ fontSize: '0.85rem', marginBottom: '4px' }}>Total delivery earnings</div>
          <div className="amount">{formatFRw(totalEarnings)}</div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="rider-empty">
          <i className="ti ti-history" aria-hidden="true" />
          No completed deliveries yet.
        </div>
      ) : (
        orders.map((o) => (
          <div className="order-card" key={o._id}>
            <div className="order-card-head">
              <span className="order-card-id">{o.orderId}</span>
              <span className="badge badge-success">Delivered</span>
            </div>
            <div className="order-card-address">
              <i className="ti ti-map-pin" aria-hidden="true" />
              {o.deliveryAddress}
            </div>
            <div className="order-card-footer">
              <span className="order-card-total">{formatFRw(o.total)}</span>
              <span className="badge badge-neutral">+{formatFRw(o.deliveryFee)} earned</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
