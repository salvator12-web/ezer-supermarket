import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { api } from '../../utils/api.js';
import { mapProducts } from '../../utils/mapProduct.js';
import ProductCard from '../shop/ProductCard.jsx';
import './FeaturedProducts.css';

export default function FeaturedProducts() {
  const { t } = useLanguage();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/products/featured')
      .then((list) => {
        if (!cancelled) setFeatured(mapProducts(list).slice(0, 8));
      })
      .catch(() => {
        if (!cancelled) setFeatured([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && featured.length === 0) return null;

  return (
    <section className="section featured-section">
      <div className="container">
        <div className="featured-header">
          <h2 className="section-title" style={{ margin: 0 }}>{t('featured.title')}</h2>
          <Link to="/shop" className="btn btn-secondary btn-sm">
            {t('featured.viewAll')} <i className="ti ti-arrow-right" aria-hidden="true" />
          </Link>
        </div>
        <div className="featured-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <div className="product-card-skeleton" key={i} />)
            : featured.map((product) => <ProductCard product={product} key={product.id} />)}
        </div>
      </div>
    </section>
  );
}
