import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { categories } from '../../data/products.js';
import { api } from '../../utils/api.js';
import './StatsBar.css';

export default function StatsBar() {
  const { t } = useLanguage();
  const [productCount, setProductCount] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/products')
      .then(({ products }) => {
        if (!cancelled) setProductCount(products.length);
      })
      .catch(() => {
        if (!cancelled) setProductCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    { icon: 'ti-shopping-bag', value: productCount != null ? `${productCount}+` : '—', label: t('stats.products') },
    { icon: 'ti-category', value: categories.length, label: t('stats.categories') },
    { icon: 'ti-users', value: '1,200+', label: t('stats.customers') },
    { icon: 'ti-map-2', value: '12+', label: t('stats.areas') },
  ];

  return (
    <section className="stats-bar">
      <div className="container stats-grid">
        {stats.map((s) => (
          <div className="stat-item" key={s.label}>
            <i className={`ti ${s.icon}`} aria-hidden="true" />
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label text-muted">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
