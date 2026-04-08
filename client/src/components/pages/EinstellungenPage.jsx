import { ThemeToggle } from '../settings/ThemeToggle.jsx';
import { BrokerTypeSelector } from '../settings/BrokerTypeSelector.jsx';
import { KeyManager } from '../settings/KeyManager.jsx';
import { AIProviderConfig } from '../settings/AIProviderConfig.jsx';
import { AutoPilotConfig } from '../settings/AutoPilotConfig.jsx';
import { de } from '../../i18n/de.js';

export function EinstellungenPage() {
  const t = de.settings;

  return (
    <div>
      <h1>{t.title}</h1>

      <section className="settings-section">
        <h2 className="settings-section__title">{t.theme.title}</h2>
        <ThemeToggle />
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">{t.brokerType.title}</h2>
        <BrokerTypeSelector />
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">{t.ai.title}</h2>
        <AIProviderConfig />
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">{t.keys.title}</h2>
        <KeyManager />
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">Automatisierung</h2>
        <AutoPilotConfig />
      </section>
    </div>
  );
}
