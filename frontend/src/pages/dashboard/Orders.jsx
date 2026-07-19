import { useEffect, useState, useMemo } from 'react';
import { api } from '../../utils/api.js';
import { formatFRw } from '../../utils/format.js';
import './dashboard-ui.css';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'picked_up', label: 'Picked up' },
  { key: 'on_the_way', label: 'On the way' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_OPTIONS = ['pending', 'accepted', 'picked_up', 'on_the_way', 'delivered', 'cancelled'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function load(status) {
    setLoading(true);
    setError('');
    try {
      const path = status && status !== 'all' ? `/orders?status=${status}` : '/orders';
      const [list, staff] = await Promise.all([api.get(path), api.get('/auth/staff?role=rider')]);
      setOrders(list);
      setRiders(staff.filter((r) => r.status === 'active'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(tab); }, [tab]);

  async function handleStatusChange(order, status) {
    setBusyId(order._id);
    try {
      const updated = await api.patch(`/orders/${order._id}/status`, { status });
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleAssign(order, riderId) {
    if (!riderId) return;
    setBusyId(order._id);
    try {
      const updated = await api.patch(`/orders/${order._id}/assign`, { riderId });
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const counts = useMemo(() => {
    const c = { all: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [orders]);

  return (
    <div>
      <div className="dash-header">
        <h1>Orders</h1>
        <p>Track, assign, and update deliveries as they move through GIGO.</p>
      </div>

      <div className="dash-toolbar">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`badge ${tab === t.key ? 'badge-accent' : 'badge-neutral'}`}
              style={{ border: 'none', cursor: 'pointer' }}
              onClick={() => setTab(t.key)}
            >
              {t.label}{counts[t.key] ? ` (${counts[t.key]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="dash-error">{error}</div>}

      <div className="dash-card">
        {loading ? (
          <div className="dash-loading">Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="dash-empty">No orders in this filter.</div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Order</th><th>Customer</th><th>Total</th><th>Payment</th>
                  <th>Rider</th><th>Status</th><th>GIGO sync</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <OrderRow
                    key={o._id}
                    order={o}
                    riders={riders}
                    busy={busyId === o._id}
                    onStatusChange={handleStatusChange}
                    onAssign={handleAssign}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderRow({ order, riders, busy, onStatusChange, onAssign }) {
  // No dedicated GIGO sync field on the Order model yet — until Phase 5 wires the
  // real Firestore/GIGO push, "synced" is derived from rider assignment.
  const synced = !!order.rider;

  return (
    <tr>
      <td>{order.orderId}</td>
      <td>{order.customerName}<div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{order.customerPhone}</div></td>
      <td>{formatFRw(order.total)}</td>
      <td><PaymentBadge order={order} /></td>
      <td>
        {order.rider ? (
          order.riderName
        ) : (
          <select
            defaultValue=""
            disabled={busy}
            onChange={(e) => onAssign(order, e.target.value)}
          >
            <option value="" disabled>Assign rider…</option>
            {riders.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
        )}
      </td>
      <td>
        <select value={order.status} disabled={busy} onChange={(e) => onStatusChange(order, e.target.value)}>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </td>
      <td><span className={`badge badge-${synced ? 'success' : 'neutral'}`}>{synced ? 'Synced' : 'Pending'}</span></td>
    </tr>
  );
}

function PaymentBadge({ order }) {
  const variant = order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'pending' ? 'warn' : 'neutral';
  return <span className={`badge badge-${variant}`}>{order.paymentMethod} · {order.paymentStatus}</span>;
}
