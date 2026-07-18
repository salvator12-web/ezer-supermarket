import { useLanguage } from '../../context/LanguageContext.jsx';
import './HowItWorks.css';

export default function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    { icon: 'ti-shopping-cart-plus', text: t('how.step1') },
    { icon: 'ti-device-mobile-dollar', text: t('how.step2') },
    { icon: 'ti-bike', text: t('how.step3') },
    { icon: 'ti-map-pin-check', text: t('how.step4') },
  ];

  return (
    <section className="section how-section">
      <div className="container">
        <h2 className="section-title">{t('how.title')}</h2>
        <ol className="how-steps">
          {steps.map((step, i) => (
            <li className="how-step" key={step.text}>
              <div className="how-step-number">{i + 1}</div>
              <i className={`ti ${step.icon}`} aria-hidden="true" />
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
