import { useState, useEffect } from 'react';
import { Link } from 'react-router';

const STORAGE_KEY = 'brokerpilot-cookie-consent';

const DEFAULT_CONSENT = {
  necessary: true,
  analytics: false,
  marketing: false,
};

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState(DEFAULT_CONSENT);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setVisible(true);
    }
  }, []);

  function saveConsent(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setVisible(false);
  }

  function handleAcceptAll() {
    saveConsent({ necessary: true, analytics: true, marketing: true });
  }

  function handleNecessaryOnly() {
    saveConsent({ necessary: true, analytics: false, marketing: false });
  }

  function handleSaveSettings() {
    saveConsent({ ...consent, necessary: true });
  }

  if (!visible) return null;

  return (
    <div className="cookie-banner">
      <div className="cookie-banner__inner">
        <div className="cookie-banner__text">
          <h4>Cookie-Einstellungen</h4>
          <p>
            Wir verwenden Cookies, um Ihnen die bestm\u00F6gliche Erfahrung zu bieten.{' '}
            <Link to="/datenschutz">Mehr erfahren</Link>
          </p>
        </div>

        <div className="cookie-banner__actions">
          <button
            className="cookie-banner__btn cookie-banner__btn--accept"
            onClick={handleAcceptAll}
          >
            Alle akzeptieren
          </button>
          <button
            className="cookie-banner__btn cookie-banner__btn--necessary"
            onClick={handleNecessaryOnly}
          >
            Nur notwendige
          </button>
          <button
            className="cookie-banner__btn cookie-banner__btn--settings"
            onClick={() => setShowSettings((s) => !s)}
          >
            Einstellungen
          </button>
        </div>

        {showSettings && (
          <div className="cookie-banner__settings">
            <CookieSetting
              name="Notwendig"
              desc="Technisch erforderliche Cookies f\u00FCr den Betrieb der Website."
              checked={true}
              disabled={true}
            />
            <CookieSetting
              name="Analyse"
              desc="Helfen uns, das Nutzungsverhalten zu verstehen und zu verbessern."
              checked={consent.analytics}
              onChange={(v) => setConsent((c) => ({ ...c, analytics: v }))}
            />
            <CookieSetting
              name="Marketing"
              desc="Werden verwendet, um relevante Inhalte und Werbung anzuzeigen."
              checked={consent.marketing}
              onChange={(v) => setConsent((c) => ({ ...c, marketing: v }))}
            />
            <div style={{ marginTop: '12px' }}>
              <button
                className="cookie-banner__btn cookie-banner__btn--accept"
                onClick={handleSaveSettings}
              >
                Einstellungen speichern
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CookieSetting({ name, desc, checked, disabled, onChange }) {
  const id = `cookie-${name.toLowerCase()}`;
  return (
    <div className="cookie-banner__setting">
      <div className="cookie-banner__setting-info">
        <div className="cookie-banner__setting-name">{name}</div>
        <div className="cookie-banner__setting-desc">{desc}</div>
      </div>
      <label className="cookie-banner__toggle">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          disabled={disabled}
          onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
        />
        <span className="cookie-banner__toggle-track" />
        <span className="cookie-banner__toggle-thumb" />
      </label>
    </div>
  );
}
