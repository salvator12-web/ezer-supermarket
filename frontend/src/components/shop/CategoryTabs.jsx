import { useLanguage } from '../../context/LanguageContext.jsx';
import { categories } from '../../data/products.js';
import './CategoryTabs.css';

export default function CategoryTabs({ active, onChange }) {
  const { t } = useLanguage();
  const tabs = ['all', ...categories];

  return (
    <div className="category-tabs" role="tablist" aria-label="Product categories">
      {tabs.map((cat) => (
        <button
          key={cat}
          type="button"
          role="tab"
          aria-selected={active === cat}
          className={`category-tab${active === cat ? ' category-tab-active' : ''}`}
          onClick={() => onChange(cat)}
        >
          {t(`categories.${cat}`)}
        </button>
      ))}
    </div>
  );
}
