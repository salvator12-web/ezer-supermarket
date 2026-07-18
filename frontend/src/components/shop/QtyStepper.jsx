import './QtyStepper.css';

export default function QtyStepper({ qty, onChange, max, disabled = false }) {
  const dec = () => onChange(Math.max(1, qty - 1));
  const inc = () => onChange(max ? Math.min(max, qty + 1) : qty + 1);

  return (
    <div className={`qty-stepper${disabled ? ' qty-stepper-disabled' : ''}`}>
      <button type="button" onClick={dec} disabled={disabled || qty <= 1} aria-label="Decrease quantity">
        <i className="ti ti-minus" aria-hidden="true" />
      </button>
      <span className="qty-value">{qty}</span>
      <button type="button" onClick={inc} disabled={disabled || (max ? qty >= max : false)} aria-label="Increase quantity">
        <i className="ti ti-plus" aria-hidden="true" />
      </button>
    </div>
  );
}
