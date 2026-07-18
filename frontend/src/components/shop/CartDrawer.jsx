import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { formatFRw } from '../../utils/format.js';
import QtyStepper from './QtyStepper.jsx';
import CheckoutForm from './CheckoutForm.jsx';
import './CartDrawer.css';

export default function CartDrawer({ open, onClose }) {
  const { t } = useLanguage();
  const { items, updateQty, removeItem, subtotal, clearCart } = useCart();
  const [step, setStep] = useState('cart'); // cart | checkout | confirmed
  const [placedOrder, setPlacedOrder] = useState(null);

  const handleClose = () => {
    onClose();
    // Reset to cart view after the close animation so it's fresh next open.
    setTimeout(() => setStep('cart'), 200);
  };

  const handlePlaced = (order) => {
    setPlacedOrder(order);
    setStep('confirmed');
    clearCart();
  };

  return (
    <>
      <div className={`cart-overlay${open ? ' cart-overlay-open' : ''}`} onClick={handleClose} aria-hidden="true" />
      <aside className={`cart-drawer${open ? ' cart-drawer-open' : ''}`} aria-label="Cart" aria-hidden={!open}>
        <div className="cart-drawer-header">
          <h3>
            {step === 'checkout' ? t('checkout.title') : step === 'confirmed' ? t('confirmation.title') : t('cart.title')}
          </h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleClose} aria-label="Close cart">
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        <div className="cart-drawer-body">
          {step === 'cart' && (
            <>
              {items.length === 0 ? (
                <div className="cart-empty">
                  <i className="ti ti-shopping-cart-off" aria-hidden="true" />
                  <p>{t('cart.empty')}</p>
                  <p className="text-muted">{t('cart.emptyHint')}</p>
                </div>
              ) : (
                <ul className="cart-items">
                  {items.map(({ product, qty }) => (
                    <li className="cart-item" key={product.id}>
                      <span className="cart-item-icon" aria-hidden="true">{product.icon}</span>
                      <div className="cart-item-body">
                        <span className="cart-item-name">{product.name}</span>
                        <span className="text-muted cart-item-unit">{formatFRw(product.price)} {t('common.each')}</span>
                        <div className="cart-item-controls">
                          <QtyStepper qty={qty} onChange={(q) => updateQty(product.id, q)} max={product.stock} />
                          <button type="button" className="cart-item-remove" onClick={() => removeItem(product.id)}>
                            <i className="ti ti-trash" aria-hidden="true" /> {t('cart.remove')}
                          </button>
                        </div>
                      </div>
                      <span className="cart-item-subtotal">{formatFRw(product.price * qty)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {step === 'checkout' && (
            <CheckoutForm items={items} subtotal={subtotal} onBack={() => setStep('cart')} onPlaced={handlePlaced} />
          )}

          {step === 'confirmed' && placedOrder && (
            <div className="order-confirmation">
              <i className="ti ti-circle-check confirmation-icon" aria-hidden="true" />
              <p className="confirmation-lead">{t('confirmation.save')}</p>
              <p className="confirmation-id">{placedOrder.orderId}</p>
              <Link to="/track" className="btn btn-primary btn-block" onClick={handleClose}>
                {t('confirmation.trackMyOrder')}
              </Link>
              <button type="button" className="btn btn-secondary btn-block" onClick={handleClose}>
                {t('confirmation.backToShop')}
              </button>
            </div>
          )}
        </div>

        {step === 'cart' && items.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="summary-row"><span>{t('cart.subtotal')}</span><span>{formatFRw(subtotal)}</span></div>
            <button type="button" className="btn btn-primary btn-block" onClick={() => setStep('checkout')}>
              {t('cart.checkout')}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
