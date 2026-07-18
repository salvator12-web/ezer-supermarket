import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatFRw } from '../../utils/format.js';
import { api } from '../../utils/api.js';
import './CheckoutForm.css';

export default function CheckoutForm({ items, subtotal, onBack, onPlaced }) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('momo');
  const [momoPhone, setMomoPhone] = useState('');
  const [error, setError] = useState('');
  const [stage, setStage] = useState('form'); // form | requestingPayment | placing

  const [quote, setQuote] = useState(null); // { distanceKm, fee, fallback }
  const [quoting, setQuoting] = useState(false);
  const quoteRequestId = useRef(0);

  // Debounced live delivery-fee quote from the real backend
  // (POST /api/delivery/quote -> Google Maps Distance Matrix, see delivery.controller.js).
  useEffect(() => {
    const trimmed = address.trim();
    if (trimmed.length <= 4) {
      setQuote(null);
      return undefined;
    }
    setQuoting(true);
    const requestId = ++quoteRequestId.current;
    const timer = setTimeout(async () => {
      try {
        const result = await api.post('/delivery/quote', { address: trimmed });
        if (quoteRequestId.current === requestId) setQuote(result);
      } catch {
        if (quoteRequestId.current === requestId) setQuote(null);
      } finally {
        if (quoteRequestId.current === requestId) setQuoting(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [address]);

  const deliveryFee = quote ? quote.fee : 0;
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim() || !quote) {
      setError(t('checkout.validation'));
      return;
    }
    if (paymentMethod === 'momo' && !momoPhone.trim()) {
      setError(t('checkout.validation'));
      return;
    }
    setError('');
    setStage('placing');

    try {
      const order = await api.post('/orders', {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        deliveryAddress: address.trim(),
        items: items.map(({ product, qty }) => ({ productId: product.id, qty })),
        paymentMethod,
        momoPhone: paymentMethod === 'momo' ? momoPhone.trim() : undefined,
      });

      if (paymentMethod === 'momo') {
        setStage('requestingPayment');
        // Fire the USSD push; checkout still completes even if MTN is
        // unreachable right now — payment status is settled via the
        // MTN callback / admin can retry later, order tracking still works.
        try {
          await api.post('/payment/momo/request', { orderId: order.orderId });
        } catch (momoErr) {
          console.warn('MoMo request failed:', momoErr.message);
        }
      }

      onPlaced(order);
    } catch (err) {
      setError(err.message || t('checkout.orderError'));
      setStage('form');
    }
  };

  if (stage === 'requestingPayment') {
    return (
      <div className="checkout-pending">
        <div className="spinner" aria-hidden="true" />
        <p className="checkout-pending-title">{t('checkout.requestingPayment')}</p>
        <p className="text-secondary">{t('checkout.confirmOnPhone')}</p>
      </div>
    );
  }

  return (
    <form className="checkout-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>{t('checkout.fullName')}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aline Uwase" />
      </label>

      <label className="field">
        <span>{t('checkout.phone')}</span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" />
      </label>

      <label className="field">
        <span>{t('checkout.address')}</span>
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t('checkout.addressPlaceholder')} />
      </label>

      {address.trim().length > 4 && (
        <div className="delivery-quote">
          {quote ? (
            <span>
              <i className="ti ti-route" aria-hidden="true" /> {quote.distanceKm != null ? `${quote.distanceKm} km ` : ''}
              {t('checkout.distanceNote')} — <strong>{formatFRw(quote.fee)}</strong>
            </span>
          ) : (
            <span className="text-muted">{t('checkout.calculating')}</span>
          )}
        </div>
      )}

      <fieldset className="payment-methods">
        <legend>{t('checkout.paymentMethod')}</legend>

        <label className={`payment-option${paymentMethod === 'momo' ? ' payment-option-active' : ''}`}>
          <input type="radio" name="payment" checked={paymentMethod === 'momo'} onChange={() => setPaymentMethod('momo')} />
          <i className="ti ti-device-mobile-dollar" aria-hidden="true" />
          <div>
            <div className="payment-option-title">{t('checkout.momo')}</div>
            <div className="text-muted payment-option-hint">{t('checkout.momoHint')}</div>
          </div>
        </label>
        {paymentMethod === 'momo' && (
          <input
            className="momo-phone-input"
            value={momoPhone}
            onChange={(e) => setMomoPhone(e.target.value)}
            placeholder={t('checkout.momoPhone')}
          />
        )}

        <label className={`payment-option${paymentMethod === 'cash' ? ' payment-option-active' : ''}`}>
          <input type="radio" name="payment" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} />
          <i className="ti ti-cash" aria-hidden="true" />
          <div>
            <div className="payment-option-title">{t('checkout.cash')}</div>
            <div className="text-muted payment-option-hint">{t('checkout.cashHint')}</div>
          </div>
        </label>
      </fieldset>

      <div className="order-summary">
        <h4>{t('checkout.orderSummary')}</h4>
        <div className="summary-row"><span>{t('cart.subtotal')}</span><span>{formatFRw(subtotal)}</span></div>
        <div className="summary-row"><span>{t('cart.deliveryFee')}</span><span>{deliveryFee ? formatFRw(deliveryFee) : '—'}</span></div>
        <div className="summary-row summary-total"><span>{t('cart.total')}</span><span>{formatFRw(total)}</span></div>
      </div>

      {error && <p className="checkout-error">{error}</p>}

      <div className="checkout-actions">
        <button type="button" className="btn btn-ghost" onClick={onBack} disabled={stage === 'placing'}>{t('checkout.back')}</button>
        <button type="submit" className="btn btn-primary btn-block" disabled={stage === 'placing'}>
          {stage === 'placing' ? '…' : t('checkout.placeOrder')}
        </button>
      </div>
    </form>
  );
}
