import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { formatFRw } from '../../utils/format.js';
import { getStockStatus } from '../../data/products.js';
import StockBadge from './StockBadge.jsx';
import QtyStepper from './QtyStepper.jsx';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const { t } = useLanguage();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const isOut = getStockStatus(product) === 'outOfStock';

  const handleAdd = () => {
    addItem(product, qty);
    setQty(1);
  };

  return (
    <div className={`product-card flat-card${isOut ? ' product-card-out' : ''}`}>
      <div className="product-card-icon" aria-hidden="true">{product.icon}</div>
      <div className="product-card-body">
        <span className="product-card-category text-muted">{t(`categories.${product.category}`)}</span>
        <h3 className="product-card-name">{product.name}</h3>
        <div className="product-card-meta">
          <span className="product-card-price">{formatFRw(product.price)}</span>
          <StockBadge product={product} />
        </div>
      </div>
      <div className="product-card-actions">
        <QtyStepper qty={qty} onChange={setQty} max={product.stock} disabled={isOut} />
        <button type="button" className="btn btn-primary btn-sm" onClick={handleAdd} disabled={isOut}>
          <i className="ti ti-shopping-cart-plus" aria-hidden="true" /> {t('shop.addToCart')}
        </button>
      </div>
    </div>
  );
}
