import { useLanguage } from '../../context/LanguageContext.jsx';
import { STATUS_STEPS } from '../../utils/status.js';
import './ProgressTracker.css';

const ICONS = {
  pending: 'ti-clock',
  accepted: 'ti-circle-check',
  pickedUp: 'ti-package',
  onTheWay: 'ti-bike',
  delivered: 'ti-home',
};

export default function ProgressTracker({ status }) {
  const { t } = useLanguage();
  const currentIndex = STATUS_STEPS.indexOf(status);

  return (
    <ol className="progress-tracker">
      {STATUS_STEPS.map((step, i) => {
        const state = i < currentIndex ? 'done' : i === currentIndex ? 'active' : 'upcoming';
        return (
          <li className={`progress-step progress-step-${state}`} key={step}>
            <span className="progress-icon"><i className={`ti ${ICONS[step]}`} aria-hidden="true" /></span>
            <span className="progress-label">{t(`track.${step}`)}</span>
          </li>
        );
      })}
    </ol>
  );
}
