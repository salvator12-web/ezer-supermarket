import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { registerRiderPush, onForegroundPush } from '../../utils/push.js';
import './RiderLayout.css';

const TABS = [
  { to: '/rider', label: 'Available', icon: 'ti-list-check', end: true },
  { to: '/rider/active', label: 'Active', icon: 'ti-truck-delivery' },
  { to: '/rider/history', label: 'History', icon: 'ti-history' },
];

export default function RiderLayout() {
  const { profile, logout } = useAuth();
  const [toast, setToast] = useState(null);
  const tabClass = ({ isActive }) => `rider-tab${isActive ? ' rider-tab-active' : ''}`;

  // Register this device for push once the rider's profile has loaded, then
  // listen for pushes that arrive while the app is open (foregrounded) — the
  // service worker (firebase-messaging-sw.js) handles background/closed pushes.
  useEffect(() => {
    if (!profile) return undefined;
    registerRiderPush();
    const unsubscribe = onForegroundPush((payload) => {
      const { title, body } = payload.notification || {};
      setToast({ title: title || 'New notification', body: body || '' });
    });
    return unsubscribe;
  }, [profile]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div className="rider-app">
      {toast && (
        <div className="rider-push-toast" role="status" onClick={() => setToast(null)}>
          <i className="ti ti-bell-ringing" aria-hidden="true" />
          <div>
            <strong>{toast.title}</strong>
            <div>{toast.body}</div>
          </div>
        </div>
      )}
      <div className="rider-topbar">
        <div className="rider-brand">
          <i className="ti ti-basket" aria-hidden="true" />
          EZER Rider
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="rider-name">{profile?.name}</span>
          <button type="button" className="icon-btn" title="Log out" onClick={logout}>
            <i className="ti ti-logout" aria-hidden="true" />
          </button>
        </div>
      </div>

      <nav className="rider-tabs" aria-label="Rider">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={tabClass}>
            <i className={`ti ${t.icon}`} aria-hidden="true" />
            {t.label}
          </NavLink>
        ))}
      </nav>

      <main className="rider-main">
        <Outlet />
      </main>
    </div>
  );
}
