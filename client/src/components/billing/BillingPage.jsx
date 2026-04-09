import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../../config.js';

const STORAGE_KEY = 'brokerpilot-plan';

const PLAN_FEATURES = {
  starter: {
    name: 'Starter',
    price: 'Kostenlos',
    priceNote: null,
    features: [
      '50 Leads',
      '1 Nutzer',
      '5 KI-Anfragen/Tag',
      'E-Mail-Support',
    ],
  },
  professional: {
    name: 'Professional',
    price: '\u20ac49',
    priceNote: '/Monat',
    features: [
      'Unbegrenzte Leads',
      '5 Nutzer',
      'Unbegrenzte KI-Anfragen',
      'Priorit\u00e4ts-Support',
      'API-Zugang',
    ],
    popular: true,
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Auf Anfrage',
    priceNote: null,
    features: [
      'Unbegrenzte Leads',
      'Unbegrenzte Nutzer',
      'Dedizierte Instanz',
      'SLA & Onboarding',
      'Custom Integrationen',
    ],
  },
};

export function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'starter';
  });
  const [loading, setLoading] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [message, setMessage] = useState(null);

  // Handle billing success/cancelled URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('billing') === 'success') {
      setMessage({ type: 'success', text: 'Abonnement erfolgreich aktiviert!' });
      if (params.get('demo') === 'true') {
        setDemoMode(true);
      }
      // Clean URL params
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('billing') === 'cancelled') {
      setMessage({ type: 'info', text: 'Upgrade abgebrochen.' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleUpgrade = useCallback(async (planId) => {
    if (planId === currentPlan) return;

    if (planId === 'enterprise') {
      window.location.href = 'mailto:kontakt@brokerpilot.de?subject=Enterprise-Anfrage';
      return;
    }

    setLoading(planId);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE}/api/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          email: localStorage.getItem('brokerpilot-email') || 'demo@brokerpilot.de',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Fehler beim Erstellen der Checkout-Sitzung');
      }

      const data = await res.json();

      if (data.demo) {
        // Demo mode — simulate upgrade
        setDemoMode(true);
        setCurrentPlan(planId);
        localStorage.setItem(STORAGE_KEY, planId);
        setMessage({ type: 'success', text: `Demo: Plan auf "${PLAN_FEATURES[planId].name}" ge\u00e4ndert.` });
      } else {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(null);
    }
  }, [currentPlan]);

  const handleManageBilling = useCallback(async () => {
    setLoading('portal');
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE}/api/billing/portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: localStorage.getItem('brokerpilot-stripe-customer') || 'cus_demo',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Fehler beim \u00d6ffnen des Kundenportals');
      }

      const data = await res.json();

      if (data.demo) {
        setDemoMode(true);
        setMessage({ type: 'info', text: 'Demo-Modus: Kundenportal ist nicht verf\u00fcgbar ohne Stripe-Schl\u00fcssel.' });
      } else {
        window.location.href = data.url;
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(null);
    }
  }, []);

  return (
    <div className="billing">
      {demoMode && (
        <div className="billing__demo-badge">
          Demo-Modus — Keine Stripe-Schl\u00fcssel konfiguriert
        </div>
      )}

      {message && (
        <div className={`billing__message billing__message--${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="billing__current">
        Aktueller Plan: <strong>{PLAN_FEATURES[currentPlan]?.name || 'Starter'}</strong>
        {currentPlan === 'starter' && ' \u2014 Kostenlos'}
      </div>

      <div className="billing__plans">
        {Object.entries(PLAN_FEATURES).map(([id, plan]) => {
          const isActive = currentPlan === id;
          const isPopular = plan.popular;

          return (
            <div
              key={id}
              className={[
                'billing__plan-card',
                isActive && 'billing__plan-card--active',
                isPopular && 'billing__plan-card--popular',
              ].filter(Boolean).join(' ')}
            >
              {isPopular && <span className="billing__popular-badge">Beliebt</span>}

              <h3 className="billing__plan-name">{plan.name}</h3>

              <div className="billing__plan-price">
                <span className="billing__price-amount">{plan.price}</span>
                {plan.priceNote && <span className="billing__price-note">{plan.priceNote}</span>}
              </div>

              <ul className="billing__plan-features">
                {plan.features.map((feature) => (
                  <li key={feature} className="billing__feature">
                    <span className="billing__feature-check">{'\u2713'}</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`billing__btn ${isActive ? 'billing__btn--current' : ''}`}
                disabled={isActive || loading !== null}
                onClick={() => handleUpgrade(id)}
              >
                {loading === id
                  ? 'Laden...'
                  : isActive
                    ? 'Aktuell'
                    : id === 'enterprise'
                      ? 'Kontakt'
                      : 'Upgraden'}
              </button>
            </div>
          );
        })}
      </div>

      {currentPlan !== 'starter' && (
        <button
          className="billing__manage-link"
          onClick={handleManageBilling}
          disabled={loading === 'portal'}
        >
          {loading === 'portal' ? 'Laden...' : 'Rechnungsverlauf verwalten \u2192'}
        </button>
      )}
    </div>
  );
}

export default BillingPage;
