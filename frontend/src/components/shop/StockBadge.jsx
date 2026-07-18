import { useLanguage } from '../../context/LanguageContext.jsx';
import { getStockStatus } from '../../data/products.js';

const STYLE_BY_STATUS = {
  inStock: 'badge-success',
  lowStock: 'badge-warn',
  critical: 'badge-warn',
  outOfStock: 'badge-muted',
};

export default function StockBadge({ product }) {
  const { t } = useLanguage();
  const status = getStockStatus(product);
  const labelKey = { inStock: 'stock.inStock', lowStock: 'stock.lowStock', critical: 'stock.critical', outOfStock: 'stock.outOfStock' }[status];

  return <span className={`badge ${STYLE_BY_STATUS[status]}`}>{t(labelKey)}</span>;
}
