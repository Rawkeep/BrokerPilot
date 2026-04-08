import { useState } from 'react';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import { useSettingsStore } from '../../stores/settingsStore.js';

/**
 * AutoPilotConfig — Settings panel to enable/configure auto-pilot mode.
 *
 * When enabled, new leads automatically trigger the full AI pipeline:
 * Qualifier → Analyst → SWOT → Proposal → Reminder
 */
export function AutoPilotConfig() {
  const autoPilot = useSettingsStore((s) => s.autoPilot);
  const setAutoPilot = useSettingsStore((s) => s.setAutoPilot);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  function toggleAutoPilot() {
    setAutoPilot({ ...autoPilot, enabled: !autoPilot?.enabled });
  }

  function toggleAutoEmail() {
    setAutoPilot({ ...autoPilot, autoEmail: !autoPilot?.autoEmail });
  }

  function toggleAutoReminder() {
    setAutoPilot({ ...autoPilot, autoReminder: !autoPilot?.autoReminder });
  }

  async function requestNotifications() {
    if (typeof Notification === 'undefined') return;
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
      new Notification('BrokerPilot', {
        body: 'Benachrichtigungen aktiviert! Du wirst über neue Leads informiert.',
        icon: '/BrokerPilot/icons/icon.svg',
      });
    }
  }

  const isEnabled = autoPilot?.enabled ?? false;

  return (
    <GlassCard hoverable={false} className="autopilot-config">
      <h3 className="autopilot-config__title">Auto-Pilot Modus</h3>
      <p className="autopilot-config__description">
        Wenn aktiviert, wird jeder neue Lead automatisch durch die KI-Pipeline geschickt.
        Du musst nur noch prüfen und bestätigen.
      </p>

      <div className="autopilot-config__toggles">
        <label className="autopilot-config__toggle">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={toggleAutoPilot}
          />
          <span className="autopilot-config__toggle-label">
            Auto-Pilot aktivieren
          </span>
          <span className="autopilot-config__toggle-desc">
            Neue Leads automatisch qualifizieren, analysieren und Angebot erstellen
          </span>
        </label>

        <label className={`autopilot-config__toggle ${!isEnabled ? 'autopilot-config__toggle--disabled' : ''}`}>
          <input
            type="checkbox"
            checked={autoPilot?.autoReminder ?? true}
            onChange={toggleAutoReminder}
            disabled={!isEnabled}
          />
          <span className="autopilot-config__toggle-label">
            Automatische Erinnerungen
          </span>
          <span className="autopilot-config__toggle-desc">
            Follow-Up Termine basierend auf KI-Empfehlung erstellen
          </span>
        </label>

        <label className={`autopilot-config__toggle ${!isEnabled ? 'autopilot-config__toggle--disabled' : ''}`}>
          <input
            type="checkbox"
            checked={autoPilot?.autoEmail ?? false}
            onChange={toggleAutoEmail}
            disabled={!isEnabled}
          />
          <span className="autopilot-config__toggle-label">
            Automatische E-Mails
          </span>
          <span className="autopilot-config__toggle-desc">
            Angebote automatisch per E-Mail an den Lead senden (erfordert E-Mail-Einrichtung)
          </span>
        </label>
      </div>

      <div className="autopilot-config__notifications">
        <h4>Browser-Benachrichtigungen</h4>
        {notifPermission === 'granted' ? (
          <p className="autopilot-config__notif-status autopilot-config__notif-status--active">
            ✅ Benachrichtigungen aktiviert
          </p>
        ) : notifPermission === 'denied' ? (
          <p className="autopilot-config__notif-status autopilot-config__notif-status--denied">
            ❌ Benachrichtigungen blockiert — bitte in Browser-Einstellungen aktivieren
          </p>
        ) : (
          <GlassButton onClick={requestNotifications}>
            Benachrichtigungen aktivieren
          </GlassButton>
        )}
      </div>
    </GlassCard>
  );
}
