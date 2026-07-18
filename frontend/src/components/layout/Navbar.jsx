import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import './Navbar.css';

export default function Navbar() {
  const { t, lang, toggleLanguage } = useLanguage();
  const { itemCount } = useCart();

  const linkClass = ({ isActive }) => `navbar-link${isActive ? ' navbar-link-active' : ''}`;

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <NavLink to="/" className="navbar-logo">
          <i className="ti ti-basket" aria-hidden="true" />
          EZER Supermarket
        </NavLink>

        <nav className="navbar-links" aria-label="Primary">
          <NavLink to="/" className={linkClass} end>{t('nav.home')}</NavLink>
          <NavLink to="/shop" className={linkClass}>{t('nav.shop')}</NavLink>
          <NavLink to="/track" className={linkClass}>{t('nav.track')}</NavLink>
        </nav>

        <div className="navbar-actions">
          <button type="button" className="lang-toggle" onClick={toggleLanguage} aria-label="Toggle language">
            {lang === 'en' ? 'FR' : 'EN'}
          </button>

          <NavLink to="/shop" className="cart-icon-link" aria-label="Cart">
            <i className="ti ti-shopping-cart" aria-hidden="true" />
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </NavLink>

          <NavLink to="/login" className="btn btn-ghost btn-sm staff-login">
            {t('nav.staffLogin')}
          </NavLink>
        </div>
      </div>
    </header>
  );
}
