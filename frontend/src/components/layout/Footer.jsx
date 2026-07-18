import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import './Footer.css';

export default function Footer() {
  const { t, lang, toggleLanguage } = useLanguage();

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="footer-logo">
            <i className="ti ti-basket" aria-hidden="true" />
            EZER Supermarket
          </div>
          <p className="text-secondary">{t('footer.tagline')}</p>
          <p className="text-muted footer-address">
            Murambi Cell, Gatenga Sector, Kicukiro District, Kigali, Rwanda
            <br />
            {t('footer.landmark')}
          </p>
        </div>

        <div className="footer-col">
          <h4>{t('footer.links')}</h4>
          <NavLink to="/">{t('nav.home')}</NavLink>
          <NavLink to="/shop">{t('nav.shop')}</NavLink>
          <NavLink to="/track">{t('nav.track')}</NavLink>
        </div>

        <div className="footer-col">
          <h4>{t('footer.contact')}</h4>
          <a href="tel:+250780000000"><i className="ti ti-phone" aria-hidden="true" /> +250 780 000 000</a>
          <a href="mailto:hello@ezersupermarket.rw"><i className="ti ti-mail" aria-hidden="true" /> hello@ezersupermarket.rw</a>
          <button type="button" className="footer-lang" onClick={toggleLanguage}>
            <i className="ti ti-language" aria-hidden="true" /> {lang === 'en' ? 'Français' : 'English'}
          </button>
        </div>
      </div>

      <div className="container footer-bottom">
        <p className="text-muted">{t('footer.copyright')}</p>
      </div>
    </footer>
  );
}
