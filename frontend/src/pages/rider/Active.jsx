import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase.js';
import { api } from '../../utils/api.js';
import { formatFRw } from '../../utils/format.js';
import './rider-ui.css';

const STEPS = ['accepted', 'picked_up', 'on_the_way', 'delivered'];
const NEXT_LABEL = {
  accepted: 'Mark picked up',
  picked_up: 'Mark on the way',
  on_the_way: 'Mark delivered',
};

export default function Active() {
  const [order, setOrder] = useState(undefined); // undefined = loading, null = none
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  async function load() {
    setError('');
    try {
      const current = await api.get('/orders/rider/active');
      setOrder(current);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  // Live updates from the backend's Firestore mirror (see firestoreSync.js) —
  // catches changes made elsewhere (e.g. an admin cancelling the order) while
  // this rider has it open. The rider's own "mark picked up/delivered" taps
  // already update local state directly from the PATCH response.
  useEffect(() => {
    if (!order || !order.orderId) return undefined;
    const unsubscribe = onSnapshot(
      doc(db, 'orders', order.orderId),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        if (data.status === 'cancelled') {
          setOrder(null);
          return;
        }
        setOrder((prev) => (prev ? { ...prev, status: data.status } : prev));
      },
      () => {} // no live updates is fine, PATCH responses still drive the UI
    );
    return unsubscribe;
  }, [order?.orderId]);

  async function handleAdvance() {
    const idx = STEPS.indexOf(order.status);
    const next = STEPS[idx + 1];
    if (!next) return;
    setUpdating(true);
    try {
      const updated = await api.patch(`/orders/${order._id}/status`, { status: next });
      setOrder(updated.status === 'delivered' ? null : updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  }

  if (order === undefined) return <div className="rider-loading">Loading your delivery…</div>;

  if (!order) {
    return (
      <div className="rider-empty">
        <i className="ti ti-truck-delivery" aria-hidden="true" />
        No active delivery.<br />
        <Link to="/rider" className="btn btn-primary btn-sm" style={{ marginTop: '14px', display: 'inline-flex' }}>
          View available orders
        </Link>
      </div>
    );
  }

  const stepIndex = STEPS.indexOf(order.status);

  return (
    <div>
      {error && <div className="dash-error">{error}</div>}

      <div className="order-card">
        <div className="order-card-head">
          <span className="order-card-id">{order.orderId}</span>
          <span className="badge badge-accent">{order.status.replace('_', ' ')}</span>
        </div>

        <div className="status-progress">
          {STEPS.map((s, i) => (
            <div key={s} className={`status-progress-step${i <= stepIndex ? ' done' : ''}`} />
          ))}
        </div>

        <div className="order-card-address">
          <i className="ti ti-map-pin" aria-hidden="true" />
          {order.deliveryAddress}
        </div>
        <div className="order-card-address">
          <i className="ti ti-user" aria-hidden="true" />
          {order.customerName} · {order.customerPhone}
        </div>
        <div className="order-card-items">
          {order.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}
        </div>

        <div className="order-card-footer">
          <span className="order-card-total">{formatFRw(order.total)}</span>
          <span className="badge badge-neutral">{order.paymentMethod}</span>
        </div>

        {NEXT_LABEL[order.status] && (
          <button
            type="button"
            className="btn btn-primary btn-block"
            style={{ marginTop: '14px' }}
            disabled={updating}
            onClick={handleAdvance}
          >
            {updating ? 'Updating…' : NEXT_LABEL[order.status]}
          </button>
        )}
      </div>
    </div>
  );
}
