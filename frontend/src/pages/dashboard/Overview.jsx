import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api.js';
import { formatFRw } from '../../utils/format.js';
import './dashboard-ui.css';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [overview, revenueByMonth] = await Promise.all([
          api.get('/stats/overview'),
          api.get('/stats/revenue'),
        ]);
        if (!cancelled) {
          setStats(overview);
          setRevenue(revenueByMonth);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="dash-loading">Loading overview…</div>;
  if (error) return <div className="dash-error">{error}</div>;

  const maxRevenue = Math.max(1, ...revenue.map((r) => r.total));

  return (
    <div>
      <div className="dash-header">
        <h1>Overview</h1>
        <p>Store performance at a glance.</p>
      </div>

      <div className="dash-kpi-grid">
        <KpiCard label="Revenue this month" value={formatFRw(stats.revenueThisMonth)} />
        <KpiCard label="Orders this month" value={stats.ordersThisMonth} />
        <KpiCard label="Total products" value={stats.totalProducts} />
        <KpiCard label="Low stock alerts" value={stats.lowStockAlerts} warn={stats.lowStockAlerts > 0} />
      </div>

      <div className="dash-grid-2">
        <div className="dash-card">
          <div className="dash-section-title">Revenue — last 6 months</div>
          {revenue.length === 0 ? (
            <div className="dash-empty">No revenue data yet.</div>
          ) : (
            <div className="dash-bar-chart">
              {revenue.map((r) => (
                <div className="dash-bar-col" key={`${r.year}-${r.month}`}>
                  <div
                    className="dash-bar"
                    style={{ height: `${Math.max(4, (r.total / maxRevenue) * 100)}%` }}
                    title={formatFRw(r.total)}
                  />
                  <span className="dash-bar-label">{MONTH_NAMES[r.month - 1]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dash-card">
          <div className="dash-section-title">Best sellers</div>
          {stats.bestSellers.length === 0 ? (
            <div className="dash-empty">No sales yet.</div>
          ) : (
            <ul>
              {stats.bestSellers.map((p) => (
                <li key={p._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid var(--border)', fontSize: '0.88rem' }}>
                  <span>{p._id} <span style={{ color: 'var(--text-muted)' }}>×{p.unitsSold}</span></span>
                  <span style={{ fontWeight: 600 }}>{formatFRw(p.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-section-title">Recent orders</div>
        {stats.recentOrders.length === 0 ? (
          <div className="dash-empty">No orders yet.</div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th></tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((o) => (
                  <tr key={o._id}>
                    <td>{o.orderId}</td>
                    <td>{o.customerName}</td>
                    <td>{formatFRw(o.total)}</td>
                    <td><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ marginTop: '14px' }}>
          <Link to="/dashboard/orders" className="btn btn-secondary btn-sm">View all orders</Link>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, warn }) {
  return (
    <div className="dash-card">
      <div className="dash-kpi-label">{label}</div>
      <div className={`dash-kpi-value${warn ? ' warn' : ''}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const variant = status === 'delivered' ? 'success' : status === 'cancelled' ? 'warn' : 'accent';
  return <span className={`badge badge-${variant}`}>{status.replace('_', ' ')}</span>;
}
