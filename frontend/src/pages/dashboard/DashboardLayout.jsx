import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import './DashboardLayout.css';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: 'ti-layout-dashboard', end: true },
  { to: '/dashboard/products', label: 'Products', icon: 'ti-shopping-bag' },
  { to: '/dashboard/inventory', label: 'Inventory', icon: 'ti-clipboard-list' },
  { to: '/dashboard/orders', label: 'Orders', icon: 'ti-package' },
];

export default function DashboardLayout() {
  const { profile, logout } = useAuth();
  const linkClass = ({ isActive }) => `dash-nav-link${isActive ? ' dash-nav-link-active' : ''}`;

  return (
    <div className="dash">
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <i className="ti ti-basket" aria-hidden="true" />
          EZER Admin
        </div>

        <nav className="dash-nav" aria-label="Dashboard">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              <i className={`ti ${item.icon}`} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="dash-user">
          <div className="dash-user-name">{profile?.name}</div>
          <div className="dash-user-role">{profile?.role}</div>
          <button type="button" className="btn btn-secondary btn-sm btn-block" onClick={logout}>
            <i className="ti ti-logout" aria-hidden="true" /> Log out
          </button>
        </div>
      </aside>

      <main className="dash-main">
        <Outlet />
      </main>
    </div>
  );
}
