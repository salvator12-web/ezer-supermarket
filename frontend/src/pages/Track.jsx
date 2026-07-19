import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext.jsx';
import { db } from '../config/firebase.js';
import { api } from '../utils/api.js';
import { formatFRw } from '../utils/format.js';
import { toStep } from '../utils/status.js';
import ProgressTracker from '../components/track/ProgressTracker.jsx';
import './Track.css';

export default function Track() {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [live, setLive] = useState(false); // true once the Firestore listener has connected

  const handleSubmit = async (e) => {
    e.preventDefault();
    const id = input.trim().toUpperCase();
    if (!id) return;
    setSearched(true);
    setLoading(true);
    setLive(false);
    setOrder(null);
    try {
      // Full order details (items, customer, payment) come from MongoDB via the REST API.
      const result = await api.get(`/orders/${encodeURIComponent(id)}`, { auth: false });
      setOrder(result);
      setOrderId(id);
    } catch {
      setOrder(null);
      setOrderId(null);
    } finally {
      setLoading(false);
    }
  };

  // Live status updates: subscribe to the lean Firestore mirror the backend
  // keeps in sync (see backend/utils/firestoreSync.js). Only status/riderName/
  // paymentStatus live there, so it's safe to read anonymously without exposing
  // customer contact info. Falls back gracefully if Firestore is unreachable —
  // the order still shows, just without live push updates.
  useEffect(() => {
    if (!orderId) return undefined;
    const unsubscribe = onSnapshot(
      doc(db, 'orders', orderId),
      (snap) => {
        setLive(true);
        if (!snap.exists()) return;
        const data = snap.data();
        setOrder((prev) => (prev ? { ...prev, status: data.status, riderName: data.riderName, paymentStatus: data.paymentStatus } : prev));
      },
      (err) => {
        console.warn('Live order updates unavailable:', err.message);
        setLive(false);
      }
    );
    return unsubscribe;
  }, [orderId]);

  return (
    <div className="section track-page">
      <div className="container track-container">
        <h1 className="section-title">{t('track.title')}</h1>

        <form className="track-search" onSubmit={handleSubmit}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('track.placeholder')} />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <i className="ti ti-search" aria-hidden="true" /> {t('track.find')}
          </button>
        </form>

        {!searched && (
          <p className="track-hint text-muted">{t('track.empty')}</p>
        )}

        {searched && loading && (
          <p className="track-hint text-muted">{t('track.loading')}</p>
        )}

        {searched && !loading && !order && (
          <div className="track-not-found flat-card">
            <i className="ti ti-mood-empty" aria-hidden="true" />
            <p>{t('track.notFound')}</p>
            <p className="text-muted">{t('track.notFoundHint')}</p>
          </div>
        )}

        {order && !loading && (
          <div className="track-result flat-card">
            <div className="track-result-header">
              <span className="track-order-id">{order.orderId}</span>
              {live && (
                <span className="track-live-badge">
                  <i className="ti ti-broadcast" aria-hidden="true" /> {t('track.live')}
                </span>
              )}
            </div>

            {order.status === 'cancelled' ? (
              <p className="track-cancelled">
                <i className="ti ti-circle-x" aria-hidden="true" /> {t('track.cancelled')}
              </p>
            ) : (
              <ProgressTracker status={toStep(order.status)} />
            )}

            <div className="track-details">
              <div className="track-detail-block">
                <h4>{t('track.items')}</h4>
                <ul className="track-items">
                  {order.items.map((item) => (
                    <li key={item.name}>
                      <span>{item.qty}× {item.name}</span>
                      <span>{formatFRw(item.price * item.qty)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="track-detail-grid">
                <div>
                  <span className="text-muted">{t('track.totalPaid')}</span>
                  <strong>{formatFRw(order.total)}</strong>
                </div>
                <div>
                  <span className="text-muted">{t('track.payment')}</span>
                  <strong>{order.paymentMethod === 'momo' ? 'MTN MoMo' : t('checkout.cash')}</strong>
                </div>
                <div>
                  <span className="text-muted">{t('track.deliveryAddress')}</span>
                  <strong>{order.deliveryAddress}</strong>
                </div>
                <div>
                  <span className="text-muted">{t('track.rider')}</span>
                  <strong>{order.rider?.name || order.riderName || t('track.unassigned')}</strong>
                </div>
                <div>
                  <span className="text-muted">{t('track.eta')}</span>
                  <strong>{order.status === 'delivered' ? t('track.delivered') : t('track.etaPending')}</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
