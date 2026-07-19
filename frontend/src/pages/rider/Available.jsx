import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api.js';
import { formatFRw } from '../../utils/format.js';
import './rider-ui.css';

export default function Available() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acceptingId, setAcceptingId] = useState(null);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    setError('');
    try {
      const list = await api.get('/orders/rider/available');
      setOrders(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAccept(order) {
    setAcceptingId(order._id);
    try {
      await api.patch(`/orders/${order._id}/assign`, {});
      navigate('/rider/active');
    } catch (err) {
      setError(err.message);
      setAcceptingId(null);
    }
  }

  if (loading) return <div className="rider-loading">Loading available orders…</div>;

  return (
    <div>
      {error && <div className="dash-error">{error}</div>}

      {orders.length === 0 ? (
        <div className="rider-empty">
          <i className="ti ti-list-check" aria-hidden="true" />
          No available orders right now.<br />Check back shortly.
        </div>
      ) : (
        orders.map((o) => (
          <div className="order-card" key={o._id}>
            <div className="order-card-head">
              <span className="order-card-id">{o.orderId}</span>
              <span className="badge badge-accent">{formatFRw(o.deliveryFee)} fee</span>
            </div>
            <div className="order-card-address">
              <i className="ti ti-map-pin" aria-hidden="true" />
              {o.deliveryAddress}
            </div>
            <div className="order-card-items">
              {o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}
            </div>
            <div className="order-card-footer">
              <span className="order-card-total">{formatFRw(o.total)}</span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={acceptingId === o._id}
                onClick={() => handleAccept(o)}
              >
                {acceptingId === o._id ? 'Accepting…' : 'Accept'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
