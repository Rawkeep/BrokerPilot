import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'brokerpilot-onboarding-done';

const TOUR_STEPS = [
  {
    title: 'Willkommen bei BrokerPilot!',
    text: 'Ihr KI-gest\u00FCtztes Broker-CRM. Lassen Sie uns die wichtigsten Features durchgehen.',
    target: null,
    position: 'center',
  },
  {
    title: 'Dashboard',
    text: 'Hier sehen Sie Ihre KPIs, Lead-Scores und anstehende Termine auf einen Blick.',
    target: '.dashboard-widgets',
    position: 'bottom',
  },
  {
    title: 'Pipeline',
    text: 'Verwalten Sie Ihre Deals im Kanban-Board. Ziehen Sie Leads zwischen Phasen.',
    target: '.top-nav__tabs',
    position: 'bottom',
  },
  {
    title: 'KI-Agenten',
    text: 'Drei spezialisierte KI-Agenten analysieren Ihre Leads automatisch: Qualifizierer, Marktanalyst und SWOT-Stratege.',
    target: '.top-nav__tabs',
    position: 'bottom',
  },
  {
    title: 'Automatisierung',
    text: 'Erstellen Sie Workflows, Drip-Kampagnen und Auto-Pilot-Regeln f\u00FCr maximale Effizienz.',
    target: '.top-nav__tabs',
    position: 'bottom',
  },
  {
    title: 'Bereit!',
    text: 'Erstellen Sie Ihren ersten Lead in der Pipeline oder erkunden Sie die Einstellungen. Viel Erfolg!',
    target: null,
    position: 'center',
  },
];

/**
 * Hook: returns { showTour, dismissTour, resetTour }
 */
export function useOnboarding() {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      setShowTour(true);
    }
  }, []);

  const dismissTour = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowTour(false);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setShowTour(true);
  }, []);

  return { showTour, dismissTour, resetTour };
}

/**
 * OnboardingTour — tooltip-guided walkthrough.
 * Props: onComplete — called when tour finishes or is skipped.
 */
export function OnboardingTour({ onComplete }) {
  const [step, setStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState(null);
  const tooltipRef = useRef(null);

  const current = TOUR_STEPS[step];
  const isFirst = step === 0;
  const isLast = step === TOUR_STEPS.length - 1;

  // Measure target element position
  useEffect(() => {
    if (!current.target) {
      setSpotlightRect(null);
      return;
    }
    const el = document.querySelector(current.target);
    if (!el) {
      setSpotlightRect(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    const padding = 8;
    setSpotlightRect({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });
  }, [step, current.target]);

  // Position tooltip near the spotlight target
  const getTooltipStyle = () => {
    if (current.position === 'center' || !spotlightRect) {
      return {};
    }
    // Position below the target
    const style = {
      top: spotlightRect.top + spotlightRect.height + 16,
      left: Math.max(16, spotlightRect.left),
    };
    // Ensure it doesn't go off-screen right
    if (style.left + 360 > window.innerWidth) {
      style.left = window.innerWidth - 376;
    }
    // If tooltip would go below viewport, put it above
    if (style.top + 200 > window.innerHeight) {
      style.top = spotlightRect.top - 220;
    }
    return style;
  };

  const handleNext = () => {
    if (isLast) {
      onComplete?.();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSkip = () => {
    onComplete?.();
  };

  const tooltipClasses = [
    'onboarding-tooltip',
    current.position === 'center' && 'onboarding-tooltip--center',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="onboarding-overlay">
      {/* Backdrop — click to skip */}
      {!spotlightRect && (
        <div className="onboarding-backdrop" onClick={handleSkip} />
      )}

      {/* Spotlight cutout */}
      {spotlightRect && (
        <div
          className="onboarding-spotlight"
          style={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={tooltipClasses}
        style={current.position !== 'center' ? getTooltipStyle() : undefined}
      >
        <h3 className="onboarding-tooltip__title">{current.title}</h3>
        <p className="onboarding-tooltip__text">{current.text}</p>

        <div className="onboarding-tooltip__nav">
          {!isFirst && !isLast ? (
            <button className="onboarding-tooltip__btn--skip" onClick={handleSkip}>
              {'\u00DC'}berspringen
            </button>
          ) : (
            <span />
          )}

          <div className="onboarding-tooltip__dots">
            {TOUR_STEPS.map((_, i) => (
              <span
                key={i}
                className={`onboarding-tooltip__dot${i === step ? ' onboarding-tooltip__dot--active' : ''}`}
              />
            ))}
          </div>

          <button
            className="onboarding-tooltip__btn onboarding-tooltip__btn--primary"
            onClick={handleNext}
          >
            {isLast ? 'Fertig' : isFirst ? 'Los geht\u2019s' : 'Weiter'}
          </button>
        </div>
      </div>
    </div>
  );
}
