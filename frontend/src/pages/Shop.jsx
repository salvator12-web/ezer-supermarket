import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../utils/api.js';
import { mapProducts } from '../utils/mapProduct.js';
import CategoryTabs from '../components/shop/CategoryTabs.jsx';
import ProductCard from '../components/shop/ProductCard.jsx';
import CartDrawer from '../components/shop/CartDrawer.jsx';
import './Shop.css';

export default function Shop() {
  const { t } = useLanguage();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .get('/products')
      .then(({ products: list }) => {
        if (!cancelled) setProducts(mapProducts(list));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === 'all' || product.category === category;
      const matchesSearch = !query || product.name.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [category, search, products]);

  return (
    <div className="section shop-page">
      <div className="container">
        <div className="shop-toolbar">
          <div className="search-input">
            <i className="ti ti-search" aria-hidden="true" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('shop.searchPlaceholder')}
              aria-label={t('shop.searchPlaceholder')}
            />
          </div>
          <button type="button" className="btn btn-primary shop-cart-btn" onClick={() => setCartOpen(true)}>
            <i className="ti ti-shopping-cart" aria-hidden="true" /> {t('cart.title')}
          </button>
        </div>

        <CategoryTabs active={category} onChange={setCategory} />

        {loading ? (
          <div className="shop-empty">
            <i className="ti ti-loader-2" aria-hidden="true" />
            <p>{t('shop.loading')}</p>
          </div>
        ) : error ? (
          <div className="shop-empty">
            <i className="ti ti-alert-triangle" aria-hidden="true" />
            <p>{t('shop.loadError')}</p>
            <p className="text-muted">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="shop-empty">
            <i className="ti ti-mood-empty" aria-hidden="true" />
            <p>{t('shop.noResults')}</p>
            <p className="text-muted">{t('shop.noResultsHint')}</p>
          </div>
        ) : (
          <div className="shop-grid">
            {filtered.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
        )}
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
