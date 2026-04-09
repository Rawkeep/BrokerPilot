import { ThemeToggle } from '../settings/ThemeToggle.jsx';
import { BrokerTypeSelector } from '../settings/BrokerTypeSelector.jsx';
import { KeyManager } from '../settings/KeyManager.jsx';
import { AIProviderConfig } from '../settings/AIProviderConfig.jsx';
import { AutoPilotConfig } from '../settings/AutoPilotConfig.jsx';
import { BillingPage } from '../billing/BillingPage.jsx';
import { HealthDashboard } from '../monitoring/HealthDashboard.jsx';
import { LanguageSelector } from '../settings/LanguageSelector.jsx';
import { t, useLanguage } from '../../i18n/index.js';

export function EinstellungenPage() {
  useLanguage(); // triggers re-render on language change

  return (
    <div>
      <h1>{t('settings.title')}</h1>

      <section className="settings-section">
        <h2 className="settings-section__title">Sprache / Language</h2>
        <LanguageSelector />
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">{t('settings.theme.title')}</h2>
        <ThemeToggle />
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">{t('settings.brokerType.title')}</h2>
        <BrokerTypeSelector />
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">{t('settings.ai.title')}</h2>
        <AIProviderConfig />
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">{t('settings.keys.title')}</h2>
        <KeyManager />
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">Automatisierung</h2>
        <AutoPilotConfig />
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">Abonnement</h2>
        <BillingPage />
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">System-Status</h2>
        <HealthDashboard />
      </section>
    </div>
  );
}

export default EinstellungenPage;
